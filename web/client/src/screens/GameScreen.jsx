import { socket } from '../socket';
import OpinionCard from '../components/OpinionCard';
import Hand from '../components/Hand';
import PlayedCardsGrid from '../components/PlayedCardsGrid';
import ScoreBoard from '../components/ScoreBoard';
import RoomCode from '../components/RoomCode';

export default function GameScreen({ state }) {
  const {
    phase,
    myId,
    judgeId,
    currentOpinionId,
    hand,
    submissions,
    submittedCount,
    totalExpected,
    winnerId,
    winnerName,
    winningCardId,
    players,
    roundNumber,
    roomCode,
  } = state;

  const isJudge = myId === judgeId;
  const judgePlayer = players.find(p => p.id === judgeId);
  const revealed = phase !== 'DEALING';
  const hasSubmitted = submissions?.some(s => s.playerId === myId);
  const mySubmittedCardId = submissions?.find(s => s.playerId === myId)?.cardId;

  function handlePlayCard(cardId) {
    socket.emit('c:playCard', { cardId });
  }

  function handlePickWinner(winnerId) {
    socket.emit('c:judgePickWinner', { winnerId });
  }

  return (
    <div className="game-screen">
      {/* Top bar */}
      <div className="top-bar">
        <RoomCode code={roomCode} />
        <div className="round-indicator">
          Round {roundNumber || '?'} / 10
          {isJudge && <span className="judge-badge">JUDGE</span>}
        </div>
        <ScoreBoard players={players} myId={myId} judgeId={judgeId} />
      </div>

      {/* Main game area */}
      <div className="game-main">
        {/* Opinion card */}
        <OpinionCard cardId={currentOpinionId} revealed={revealed} />

        {/* Phase-specific content */}
        {phase === 'DEALING' && (
          <div className="status-message">Dealing cards...</div>
        )}

        {phase === 'JUDGE_REVEALS' && (
          <div className="status-message">
            {isJudge
              ? 'You are the judge this round!'
              : `${judgePlayer?.name || 'The judge'} is reading the question...`}
          </div>
        )}

        {phase === 'PLAYING' && (
          <>
            <div className="submission-tracker">
              {isJudge
                ? `Waiting for ${totalExpected} player${totalExpected !== 1 ? 's' : ''} to submit...`
                : hasSubmitted
                  ? `Waiting... ${submittedCount}/${totalExpected} submitted`
                  : `Pick a card — ${submittedCount}/${totalExpected} submitted`}
            </div>

            {isJudge && (
              <div className="status-message" style={{ fontSize: 14 }}>
                You're judging this round. Sit tight while others submit their cards.
              </div>
            )}

            {!isJudge && (
              <Hand
                cards={hand}
                onPlayCard={handlePlayCard}
                disabled={hasSubmitted}
              />
            )}
          </>
        )}

        {(phase === 'JUDGING' || phase === 'SCORING') && (
          <>
            {phase === 'JUDGING' && isJudge && (
              <div className="judge-prompt">
                Pick your favourite answer!
              </div>
            )}

            {phase === 'SCORING' && (
              <div className="winner-announcement">
                {winnerName} wins this round!
              </div>
            )}

            {submissions && (
              <PlayedCardsGrid
                submissions={submissions}
                isJudge={isJudge && phase === 'JUDGING'}
                onPickWinner={handlePickWinner}
                winnerId={phase === 'SCORING' ? winnerId : null}
                mySubmittedCardId={mySubmittedCardId}
              />
            )}

            {phase === 'SCORING' && (
              <div className="next-round-msg">
                Next round starting soon...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
