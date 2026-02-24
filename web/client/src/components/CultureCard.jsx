import { cultureCardMap } from '../cardData';

export default function CultureCard({
  cardId,
  onClick,
  disabled = false,
  selected = false,
  winner = false,
  playerName = null,
}) {
  const card = cultureCardMap[cardId];
  if (!card) return null;

  const classes = [
    'culture-card',
    disabled && 'disabled',
    selected && 'selected',
    winner && 'winner',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={disabled ? undefined : onClick}
      title={disabled ? undefined : 'Click to play'}
    >
      <div className="culture-card-title">{card.title}</div>
      <div className="culture-card-desc">{card.description}</div>
      {playerName && (
        <div className="culture-card-player">{playerName}</div>
      )}
    </div>
  );
}
