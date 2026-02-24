import { useEffect, useReducer, useCallback } from 'react';
import { socket } from './socket';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';

const initialState = {
  phase: null,
  myId: null,
  myName: '',
  roomCode: null,
  isHost: false,
  players: [],
  orderedPlayerIds: [],
  judgeId: null,
  roundNumber: 0,
  currentOpinionId: null,
  hand: [],
  submittedCount: 0,
  totalExpected: 0,
  submissions: null,
  winnerId: null,
  winnerName: null,
  winningCardId: null,
  finalScores: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, myName: action.name };

    case 'ROOM_CREATED':
      return {
        ...state,
        roomCode: action.roomCode,
        myId: action.myId,
        phase: 'LOBBY',
        isHost: true,
        players: [{ id: action.myId, name: state.myName, score: 0, connected: true }],
        orderedPlayerIds: [action.myId],
        error: null,
      };

    case 'JOINED_ROOM':
      return {
        ...state,
        roomCode: action.roomCode,
        myId: action.myId,
        phase: 'LOBBY',
        isHost: false,
        players: action.players,
        orderedPlayerIds: action.players.map(p => p.id),
        error: null,
      };

    case 'PLAYER_JOINED':
      return {
        ...state,
        players: [...state.players, action.player],
        orderedPlayerIds: [...state.orderedPlayerIds, action.player.id],
      };

    case 'PLAYER_LEFT':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.playerId),
        orderedPlayerIds: state.orderedPlayerIds.filter(id => id !== action.playerId),
      };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'DEALING',
        orderedPlayerIds: action.orderedPlayerIds,
        judgeId: action.judgeId,
        roundNumber: action.roundNumber,
        submissions: null,
        winnerId: null,
        winnerName: null,
        winningCardId: null,
      };

    case 'HAND_DEALT':
      return { ...state, hand: action.hand };

    case 'OPINION_REVEALED':
      return {
        ...state,
        phase: 'JUDGE_REVEALS',
        currentOpinionId: action.cardId,
        roundNumber: action.roundNumber,
      };

    case 'ROUND_STARTED':
      return {
        ...state,
        phase: 'PLAYING',
        judgeId: action.judgeId || state.judgeId,
        submissions: null,
        submittedCount: 0,
        totalExpected: action.totalExpected,
        winnerId: null,
        winnerName: null,
        winningCardId: null,
      };

    case 'CARD_ACCEPTED':
      return { ...state, hand: state.hand.filter(id => id !== action.cardId) };

    case 'SUBMISSIONS_UPDATE':
      return {
        ...state,
        submittedCount: action.submittedCount,
        totalExpected: action.totalExpected,
      };

    case 'ALL_CARDS_PLAYED':
      return { ...state, phase: 'JUDGING', submissions: action.submissions };

    case 'ROUND_WINNER':
      return {
        ...state,
        phase: 'SCORING',
        winnerId: action.winnerId,
        winnerName: action.winnerName,
        winningCardId: action.winningCardId,
        players: state.players.map(p => {
          const updated = action.scores.find(s => s.id === p.id);
          return updated ? { ...p, score: updated.score } : p;
        }),
      };

    case 'CARD_DRAWN':
      return { ...state, hand: [...state.hand, action.cardId] };

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'JUDGE_REVEALS',
        judgeId: action.judgeId,
        currentOpinionId: action.opinionCardId,
        roundNumber: action.roundNumber,
      };

    case 'GAME_OVER':
      return { ...state, phase: 'GAME_OVER', finalScores: action.finalScores };

    case 'GAME_STATE':
      return {
        ...state,
        phase: action.state.phase,
        roomCode: action.state.roomCode,
        myId: action.state.playerId,
        players: action.state.players,
        orderedPlayerIds: action.state.players.map(p => p.id),
        judgeId: action.state.judgeId,
        roundNumber: action.state.roundNumber,
        currentOpinionId: action.state.currentOpinionId,
        hand: action.state.hand || [],
        submissions: action.state.submissions,
        submittedCount: action.state.submittedCount || 0,
        totalExpected: action.state.totalExpected || 0,
      };

    case 'ERROR':
      return { ...state, error: action.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    socket.connect();

    socket.on('s:roomCreated', ({ roomCode, playerId }) => {
      dispatch({ type: 'ROOM_CREATED', roomCode, myId: playerId });
    });

    socket.on('s:joinedRoom', ({ roomCode, playerId, players }) => {
      dispatch({ type: 'JOINED_ROOM', roomCode, myId: playerId, players });
    });

    socket.on('s:playerJoined', ({ player }) => {
      dispatch({ type: 'PLAYER_JOINED', player });
    });

    socket.on('s:playerLeft', ({ playerId }) => {
      dispatch({ type: 'PLAYER_LEFT', playerId });
    });

    socket.on('s:gameStarted', ({ orderedPlayerIds, judgeId, roundNumber }) => {
      dispatch({ type: 'GAME_STARTED', orderedPlayerIds, judgeId, roundNumber });
    });

    socket.on('s:dealtHand', ({ hand }) => {
      dispatch({ type: 'HAND_DEALT', hand });
    });

    socket.on('s:opinionRevealed', ({ cardId, roundNumber }) => {
      dispatch({ type: 'OPINION_REVEALED', cardId, roundNumber });
    });

    socket.on('s:roundStarted', ({ totalExpected, judgeId }) => {
      dispatch({ type: 'ROUND_STARTED', totalExpected, judgeId });
    });

    socket.on('s:cardAccepted', ({ cardId }) => {
      dispatch({ type: 'CARD_ACCEPTED', cardId });
    });

    socket.on('s:submissionsUpdate', ({ submittedCount, totalExpected }) => {
      dispatch({ type: 'SUBMISSIONS_UPDATE', submittedCount, totalExpected });
    });

    socket.on('s:allCardsPlayed', ({ submissions }) => {
      dispatch({ type: 'ALL_CARDS_PLAYED', submissions });
    });

    socket.on('s:roundWinner', ({ winnerId, winnerName, winningCardId, scores }) => {
      dispatch({ type: 'ROUND_WINNER', winnerId, winnerName, winningCardId, scores });
    });

    socket.on('s:cardDrawn', ({ cardId }) => {
      dispatch({ type: 'CARD_DRAWN', cardId });
    });

    socket.on('s:nextRound', ({ judgeId, opinionCardId, roundNumber }) => {
      dispatch({ type: 'NEXT_ROUND', judgeId, opinionCardId, roundNumber });
    });

    socket.on('s:gameOver', ({ finalScores }) => {
      dispatch({ type: 'GAME_OVER', finalScores });
    });

    socket.on('s:gameState', (gameState) => {
      dispatch({ type: 'GAME_STATE', state: gameState });
    });

    socket.on('s:error', ({ message }) => {
      dispatch({ type: 'ERROR', message });
    });

    return () => {
      socket.off('s:roomCreated');
      socket.off('s:joinedRoom');
      socket.off('s:playerJoined');
      socket.off('s:playerLeft');
      socket.off('s:gameStarted');
      socket.off('s:dealtHand');
      socket.off('s:opinionRevealed');
      socket.off('s:roundStarted');
      socket.off('s:cardAccepted');
      socket.off('s:submissionsUpdate');
      socket.off('s:allCardsPlayed');
      socket.off('s:roundWinner');
      socket.off('s:cardDrawn');
      socket.off('s:nextRound');
      socket.off('s:gameOver');
      socket.off('s:gameState');
      socket.off('s:error');
      socket.disconnect();
    };
  }, []);

  const setName = useCallback((name) => dispatch({ type: 'SET_NAME', name }), []);
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  const { phase } = state;
  const inGame = phase === 'DEALING' || phase === 'JUDGE_REVEALS' || phase === 'PLAYING' || phase === 'JUDGING' || phase === 'SCORING';

  return (
    <div className="app">
      {state.error && (
        <div className="error-banner" onClick={clearError}>
          {state.error} &mdash; click to dismiss
        </div>
      )}
      {phase === null && (
        <HomeScreen myName={state.myName} onSetName={setName} />
      )}
      {phase === 'LOBBY' && (
        <LobbyScreen
          roomCode={state.roomCode}
          players={state.players}
          isHost={state.isHost}
          myId={state.myId}
        />
      )}
      {inGame && (
        <GameScreen state={state} />
      )}
      {phase === 'GAME_OVER' && (
        <GameOverScreen finalScores={state.finalScores} myId={state.myId} />
      )}
    </div>
  );
}

export default App;
