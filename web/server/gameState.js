// Pure state-transition functions — no I/O, no side effects
const { opinionCards, cultureCards } = require('./cardData');

const HAND_SIZE = 7;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createRoom(code, hostSocketId, hostName) {
  const room = {
    code,
    phase: 'LOBBY',
    hostSocketId,
    players: new Map(),
    orderedPlayerIds: [],
    opinionDeck: [],
    cultureDeck: [],
    discardPile: [],
    currentOpinionId: null,
    judgeIndex: 0,
    roundNumber: 0,
    submissions: new Map(),
  };
  addPlayerToRoom(room, hostSocketId, hostName);
  return room;
}

function addPlayerToRoom(room, socketId, name) {
  room.players.set(socketId, {
    id: socketId,
    name,
    hand: [],
    score: 0,
    connected: true,
  });
  room.orderedPlayerIds.push(socketId);
  return room;
}

function removePlayerFromRoom(room, socketId) {
  room.players.delete(socketId);
  room.orderedPlayerIds = room.orderedPlayerIds.filter(id => id !== socketId);
  return room;
}

function disconnectPlayer(room, socketId) {
  const player = room.players.get(socketId);
  if (player) player.connected = false;
  return room;
}

function reshuffleDeck(room) {
  if (room.discardPile.length === 0) return;
  room.cultureDeck = shuffle(room.discardPile);
  room.discardPile = [];
}

function drawCard(room) {
  if (room.cultureDeck.length === 0) reshuffleDeck(room);
  return room.cultureDeck.pop();
}

function startGame(room) {
  room.opinionDeck = shuffle(opinionCards.map(c => c.id));
  room.cultureDeck = shuffle(cultureCards.map(c => c.id));
  room.discardPile = [];
  room.roundNumber = 0;
  room.judgeIndex = 0;
  room.submissions = new Map();
  room.phase = 'DEALING';

  const hands = new Map();
  for (const [socketId, player] of room.players) {
    player.hand = [];
    for (let i = 0; i < HAND_SIZE; i++) {
      const card = drawCard(room);
      if (card !== undefined) player.hand.push(card);
    }
    hands.set(socketId, [...player.hand]);
  }

  return { room, hands };
}

function startRound(room) {
  room.roundNumber += 1;
  room.currentOpinionId = room.opinionDeck.pop();
  room.submissions = new Map();
  room.phase = 'JUDGE_REVEALS';
  return room;
}

function setPlaying(room) {
  room.phase = 'PLAYING';
  return room;
}

function getJudgeId(room) {
  return room.orderedPlayerIds[room.judgeIndex % room.orderedPlayerIds.length];
}

function getTotalExpected(room) {
  const judgeId = getJudgeId(room);
  return room.orderedPlayerIds.filter(
    id => id !== judgeId && room.players.get(id)?.connected
  ).length;
}

function submitCard(room, socketId, cardId) {
  const player = room.players.get(socketId);
  if (!player) throw new Error('Player not found');

  const handIndex = player.hand.indexOf(cardId);
  if (handIndex === -1) throw new Error('Card not in hand');

  player.hand.splice(handIndex, 1);
  room.submissions.set(socketId, cardId);

  const judgeId = getJudgeId(room);
  const connectedNonJudges = room.orderedPlayerIds.filter(
    id => id !== judgeId && room.players.get(id)?.connected
  );
  const allSubmitted = connectedNonJudges.every(id => room.submissions.has(id));

  if (allSubmitted) room.phase = 'JUDGING';

  return { room, allSubmitted };
}

function pickWinner(room, winnerId) {
  const winningCardId = room.submissions.get(winnerId);
  if (winningCardId === undefined) throw new Error('Winner not found in submissions');

  const winner = room.players.get(winnerId);
  if (winner) winner.score += 1;

  for (const cardId of room.submissions.values()) {
    room.discardPile.push(cardId);
  }

  room.phase = 'SCORING';

  const scores = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
  }));

  return { room, winningCardId, scores };
}

function drawReplacements(room) {
  const judgeId = getJudgeId(room);
  const drawn = new Map();

  for (const [socketId, player] of room.players) {
    if (socketId !== judgeId && player.connected) {
      const card = drawCard(room);
      if (card !== undefined) {
        player.hand.push(card);
        drawn.set(socketId, card);
      }
    }
  }

  return { room, drawn };
}

function advanceJudge(room) {
  room.judgeIndex = (room.judgeIndex + 1) % room.orderedPlayerIds.length;
  return room;
}

function isGameOver(room) {
  return room.roundNumber >= 10;
}

function getFinalScores(room) {
  return Array.from(room.players.values())
    .map(p => ({ id: p.id, name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
}

function getPlayersArray(room) {
  return room.orderedPlayerIds.map(id => {
    const p = room.players.get(id);
    return { id: p.id, name: p.name, score: p.score, connected: p.connected };
  });
}

module.exports = {
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
  HAND_SIZE,
};
