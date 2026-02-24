import CultureCard from './CultureCard';

export default function PlayedCardsGrid({
  submissions,
  isJudge,
  onPickWinner,
  winnerId,
  mySubmittedCardId,
}) {
  if (!submissions || submissions.length === 0) return null;

  return (
    <div className="played-cards-grid">
      <div className="played-cards-label">
        {winnerId ? 'Submitted Cards' : `${submissions.length} card${submissions.length !== 1 ? 's' : ''} submitted`}
      </div>
      <div className="played-cards-scroll">
        {submissions.map(({ playerId, playerName, cardId }) => {
          const isWinner = winnerId && playerId === winnerId;
          const isMine = cardId === mySubmittedCardId;
          return (
            <div key={playerId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <CultureCard
                cardId={cardId}
                onClick={isJudge ? () => onPickWinner(playerId) : undefined}
                disabled={!isJudge}
                winner={isWinner}
                playerName={winnerId ? playerName : (isMine ? 'you' : null)}
              />
              {isJudge && !winnerId && (
                <button
                  className="btn btn-primary"
                  onClick={() => onPickWinner(playerId)}
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  Pick this
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
