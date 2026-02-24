export default function ScoreBoard({ players, myId, judgeId }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="scoreboard">
      {players.map(p => (
        <div
          key={p.id}
          className={[
            'score-entry',
            p.id === myId && 'is-me',
            p.id === judgeId && 'is-judge',
          ].filter(Boolean).join(' ')}
        >
          <span className="score-name" title={p.name}>
            {p.name}
            {p.id === judgeId && ' ⚖️'}
          </span>
          <span className="score-pts">{p.score}</span>
        </div>
      ))}
    </div>
  );
}
