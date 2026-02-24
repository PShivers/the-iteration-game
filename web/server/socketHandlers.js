const {
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  disconnectPlayer,
  startGame,
  startRound,
  setPlaying,
  getJudgeId,
  getTotalExpected,
  submitCard,
  pickWinner,
  drawReplacements,
  advanceJudge,
  isGameOver,
  getFinalScores,
  getPlayersArray,
} = require('./gameState');
const { uniqueCode } = require('./roomCodes');

module.exports = function setupSocketHandlers(io, rooms) {
  // Track which room each socket belongs to
  const socketRoomMap = new Map();

  function getRoomForSocket(socketId) {
    const code = socketRoomMap.get(socketId);
    return code ? rooms.get(code) : null;
  }

  io.on('connection', (socket) => {
    console.log(`[connect] ${socket.id}`);

    // ── c:createRoom ────────────────────────────────────────────
    socket.on('c:createRoom', ({ playerName } = {}) => {
      try {
        const name = playerName?.trim();
        if (!name) return socket.emit('s:error', { code: 'INVALID_NAME', message: 'Name is required' });

        const code = uniqueCode(rooms);
        const room = createRoom(code, socket.id, name);
        rooms.set(code, room);
        socket.join(code);
        socketRoomMap.set(socket.id, code);

        socket.emit('s:roomCreated', { roomCode: code, playerId: socket.id });
        console.log(`[createRoom] ${code} by ${name}`);
      } catch (e) {
        console.error('[createRoom error]', e);
        socket.emit('s:error', { code: 'CREATE_FAILED', message: e.message });
      }
    });

    // ── c:joinRoom ───────────────────────────────────────────────
    socket.on('c:joinRoom', ({ roomCode, playerName } = {}) => {
      try {
        const code = roomCode?.trim().toUpperCase();
        const name = playerName?.trim();

        if (!code || !name) {
          return socket.emit('s:error', { code: 'INVALID_INPUT', message: 'Room code and name are required' });
        }

        const room = rooms.get(code);
        if (!room) return socket.emit('s:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        if (room.phase !== 'LOBBY') return socket.emit('s:error', { code: 'GAME_STARTED', message: 'Game already in progress' });

        const nameTaken = Array.from(room.players.values()).some(
          p => p.name.toLowerCase() === name.toLowerCase()
        );
        if (nameTaken) return socket.emit('s:error', { code: 'NAME_TAKEN', message: 'That name is already taken' });

        addPlayerToRoom(room, socket.id, name);
        socket.join(code);
        socketRoomMap.set(socket.id, code);

        socket.emit('s:joinedRoom', {
          roomCode: code,
          playerId: socket.id,
          players: getPlayersArray(room),
        });
        socket.broadcast.to(code).emit('s:playerJoined', {
          player: { id: socket.id, name, score: 0, connected: true },
        });

        console.log(`[joinRoom] ${name} joined ${code}`);
      } catch (e) {
        console.error('[joinRoom error]', e);
        socket.emit('s:error', { code: 'JOIN_FAILED', message: e.message });
      }
    });

    // ── c:rejoinRoom ─────────────────────────────────────────────
    socket.on('c:rejoinRoom', ({ roomCode, playerName } = {}) => {
      try {
        const code = roomCode?.trim().toUpperCase();
        const name = playerName?.trim();

        const room = rooms.get(code);
        if (!room) return socket.emit('s:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });

        // Find player by name (case-insensitive)
        let oldSocketId = null;
        let foundPlayer = null;
        for (const [sid, player] of room.players) {
          if (player.name.toLowerCase() === name?.toLowerCase()) {
            oldSocketId = sid;
            foundPlayer = player;
            break;
          }
        }

        if (!foundPlayer) {
          return socket.emit('s:error', { code: 'PLAYER_NOT_FOUND', message: 'Player not found in room' });
        }

        // Update socketId throughout room state
        room.players.delete(oldSocketId);
        foundPlayer.id = socket.id;
        foundPlayer.connected = true;
        room.players.set(socket.id, foundPlayer);

        const idx = room.orderedPlayerIds.indexOf(oldSocketId);
        if (idx !== -1) room.orderedPlayerIds[idx] = socket.id;

        if (room.hostSocketId === oldSocketId) room.hostSocketId = socket.id;

        if (room.submissions.has(oldSocketId)) {
          const cardId = room.submissions.get(oldSocketId);
          room.submissions.delete(oldSocketId);
          room.submissions.set(socket.id, cardId);
        }

        socketRoomMap.delete(oldSocketId);
        socketRoomMap.set(socket.id, code);
        socket.join(code);

        const judgeId = getJudgeId(room);
        const submissionsArr = (room.phase === 'JUDGING' || room.phase === 'SCORING')
          ? Array.from(room.submissions.entries()).map(([pid, cardId]) => ({
              playerId: pid,
              playerName: room.players.get(pid)?.name,
              cardId,
            }))
          : null;

        socket.emit('s:gameState', {
          phase: room.phase,
          roomCode: code,
          playerId: socket.id,
          players: getPlayersArray(room),
          judgeId,
          roundNumber: room.roundNumber,
          currentOpinionId: room.currentOpinionId,
          hand: foundPlayer.hand,
          submissions: submissionsArr,
          submittedCount: room.submissions.size,
          totalExpected: getTotalExpected(room),
        });

        socket.broadcast.to(code).emit('s:playerJoined', {
          player: {
            id: socket.id,
            name: foundPlayer.name,
            score: foundPlayer.score,
            connected: true,
          },
        });

        console.log(`[rejoinRoom] ${name} rejoined ${code}`);
      } catch (e) {
        console.error('[rejoinRoom error]', e);
        socket.emit('s:error', { code: 'REJOIN_FAILED', message: e.message });
      }
    });

    // ── c:startGame ──────────────────────────────────────────────
    socket.on('c:startGame', () => {
      try {
        const room = getRoomForSocket(socket.id);
        if (!room) return socket.emit('s:error', { code: 'NOT_IN_ROOM', message: 'Not in a room' });
        if (room.hostSocketId !== socket.id) return socket.emit('s:error', { code: 'NOT_HOST', message: 'Only the host can start the game' });
        if (room.phase !== 'LOBBY') return socket.emit('s:error', { code: 'WRONG_PHASE', message: 'Game already started' });
        if (room.players.size < 3) return socket.emit('s:error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 3 players to start' });

        const { hands } = startGame(room);
        const judgeId = getJudgeId(room);

        io.to(room.code).emit('s:gameStarted', {
          orderedPlayerIds: room.orderedPlayerIds,
          judgeId,
          roundNumber: 0,
        });

        // Unicast hands — never broadcast
        for (const [sid, hand] of hands) {
          io.to(sid).emit('s:dealtHand', { hand });
        }

        // Reveal opinion card after 1s (gives clients time to animate dealing)
        setTimeout(() => {
          startRound(room);
          io.to(room.code).emit('s:opinionRevealed', {
            cardId: room.currentOpinionId,
            roundNumber: room.roundNumber,
          });

          // Start playing phase after 2s more
          setTimeout(() => {
            setPlaying(room);
            io.to(room.code).emit('s:roundStarted', {
              judgeId: getJudgeId(room),
              totalExpected: getTotalExpected(room),
            });
          }, 2000);
        }, 1000);

        console.log(`[startGame] room ${room.code} with ${room.players.size} players`);
      } catch (e) {
        console.error('[startGame error]', e);
        socket.emit('s:error', { code: 'START_FAILED', message: e.message });
      }
    });

    // ── c:playCard ───────────────────────────────────────────────
    socket.on('c:playCard', ({ cardId } = {}) => {
      try {
        const room = getRoomForSocket(socket.id);
        if (!room) return socket.emit('s:error', { code: 'NOT_IN_ROOM', message: 'Not in a room' });
        if (room.phase !== 'PLAYING') return socket.emit('s:error', { code: 'WRONG_PHASE', message: 'Not in playing phase' });

        const judgeId = getJudgeId(room);
        if (socket.id === judgeId) return socket.emit('s:error', { code: 'IS_JUDGE', message: 'Judge cannot play a card' });
        if (room.submissions.has(socket.id)) return socket.emit('s:error', { code: 'ALREADY_PLAYED', message: 'Already submitted a card' });
        if (cardId === undefined || cardId === null) return socket.emit('s:error', { code: 'INVALID_CARD', message: 'No card specified' });

        const { allSubmitted } = submitCard(room, socket.id, cardId);

        socket.emit('s:cardAccepted', { cardId });

        io.to(room.code).emit('s:submissionsUpdate', {
          submittedCount: room.submissions.size,
          totalExpected: getTotalExpected(room),
        });

        if (allSubmitted) {
          const submissions = Array.from(room.submissions.entries()).map(([pid, cid]) => ({
            playerId: pid,
            playerName: room.players.get(pid)?.name,
            cardId: cid,
          }));
          io.to(room.code).emit('s:allCardsPlayed', { submissions });
        }

        console.log(`[playCard] ${socket.id} played card ${cardId}`);
      } catch (e) {
        console.error('[playCard error]', e);
        socket.emit('s:error', { code: 'PLAY_FAILED', message: e.message });
      }
    });

    // ── c:judgePickWinner ────────────────────────────────────────
    socket.on('c:judgePickWinner', ({ winnerId } = {}) => {
      try {
        const room = getRoomForSocket(socket.id);
        if (!room) return socket.emit('s:error', { code: 'NOT_IN_ROOM', message: 'Not in a room' });
        if (room.phase !== 'JUDGING') return socket.emit('s:error', { code: 'WRONG_PHASE', message: 'Not in judging phase' });

        const judgeId = getJudgeId(room);
        if (socket.id !== judgeId) return socket.emit('s:error', { code: 'NOT_JUDGE', message: 'Only the judge can pick a winner' });
        if (!room.submissions.has(winnerId)) return socket.emit('s:error', { code: 'INVALID_WINNER', message: 'Invalid winner selection' });

        const { winningCardId, scores } = pickWinner(room, winnerId);
        const winnerPlayer = room.players.get(winnerId);

        io.to(room.code).emit('s:roundWinner', {
          winnerId,
          winnerName: winnerPlayer?.name,
          winningCardId,
          scores,
        });

        const { drawn } = drawReplacements(room);
        for (const [sid, newCardId] of drawn) {
          io.to(sid).emit('s:cardDrawn', { cardId: newCardId });
        }

        // Advance after 3s
        setTimeout(() => {
          if (isGameOver(room)) {
            room.phase = 'GAME_OVER';
            const finalScores = getFinalScores(room);
            io.to(room.code).emit('s:gameOver', {
              finalScores,
              winnerId: finalScores[0]?.id,
            });
          } else {
            advanceJudge(room);
            startRound(room);
            const newJudgeId = getJudgeId(room);

            io.to(room.code).emit('s:nextRound', {
              judgeId: newJudgeId,
              opinionCardId: room.currentOpinionId,
              roundNumber: room.roundNumber,
            });

            setTimeout(() => {
              setPlaying(room);
              io.to(room.code).emit('s:roundStarted', {
                judgeId: newJudgeId,
                totalExpected: getTotalExpected(room),
              });
            }, 2000);
          }
        }, 3000);

        console.log(`[judgePickWinner] winner: ${winnerId}, card: ${winningCardId}`);
      } catch (e) {
        console.error('[judgePickWinner error]', e);
        socket.emit('s:error', { code: 'PICK_FAILED', message: e.message });
      }
    });

    // ── disconnect ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      try {
        const room = getRoomForSocket(socket.id);
        if (!room) return;

        socketRoomMap.delete(socket.id);

        if (room.phase === 'LOBBY') {
          removePlayerFromRoom(room, socket.id);
          io.to(room.code).emit('s:playerLeft', { playerId: socket.id });

          if (room.players.size === 0) {
            rooms.delete(room.code);
          } else if (room.hostSocketId === socket.id && room.orderedPlayerIds.length > 0) {
            room.hostSocketId = room.orderedPlayerIds[0];
          }
        } else {
          disconnectPlayer(room, socket.id);
          io.to(room.code).emit('s:playerLeft', { playerId: socket.id });

          // If judge disconnected during an active round, advance judge and restart
          const currentJudgeId = getJudgeId(room);
          if (socket.id === currentJudgeId && (room.phase === 'PLAYING' || room.phase === 'JUDGING')) {
            advanceJudge(room);
            const newJudgeId = getJudgeId(room);
            room.submissions = new Map();
            setPlaying(room);
            io.to(room.code).emit('s:roundStarted', {
              judgeId: newJudgeId,
              totalExpected: getTotalExpected(room),
            });
          }

          // Check if all remaining connected non-judges have now submitted
          if (room.phase === 'PLAYING') {
            const judgeId = getJudgeId(room);
            const connectedNonJudges = room.orderedPlayerIds.filter(
              id => id !== judgeId && room.players.get(id)?.connected
            );
            if (connectedNonJudges.length > 0 && connectedNonJudges.every(id => room.submissions.has(id))) {
              room.phase = 'JUDGING';
              const submissions = Array.from(room.submissions.entries()).map(([pid, cid]) => ({
                playerId: pid,
                playerName: room.players.get(pid)?.name,
                cardId: cid,
              }));
              io.to(room.code).emit('s:allCardsPlayed', { submissions });
            }
          }
        }

        console.log(`[disconnect] ${socket.id}`);
      } catch (e) {
        console.error('[disconnect error]', e);
      }
    });
  });
};
