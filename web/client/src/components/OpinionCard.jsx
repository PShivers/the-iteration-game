import { opinionCardMap } from '../cardData';

export default function OpinionCard({ cardId, revealed }) {
  const card = cardId !== null && cardId !== undefined ? opinionCardMap[cardId] : null;

  if (!revealed || !card) {
    return (
      <div className="opinion-card face-down">
        <div className="opinion-card-label">OPINION</div>
      </div>
    );
  }

  return (
    <div className="opinion-card">
      <div className="opinion-card-label">OPINION</div>
      <div className="opinion-card-text">{card.text}</div>
    </div>
  );
}
