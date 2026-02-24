import CultureCard from './CultureCard';

export default function Hand({ cards, onPlayCard, disabled }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="hand-container">
      <div className="hand-label">Your hand ({cards.length})</div>
      <div className="hand-scroll">
        {cards.map(cardId => (
          <CultureCard
            key={cardId}
            cardId={cardId}
            onClick={() => onPlayCard && onPlayCard(cardId)}
            disabled={disabled || !onPlayCard}
          />
        ))}
      </div>
    </div>
  );
}
