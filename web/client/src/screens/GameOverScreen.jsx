export default function GameOverScreen({ finalScores, myId }) {
  const winner = finalScores?.[0];
  const isMyWin = winner?.id === myId;

  return (
    <div className="game-over-screen">
      <div className="screen-title">
        {isMyWin ? 'YOU WIN!' : 'GAME OVER'}
      </div>

      {winner && (
        <div style={{ fontSize: 16, color: '#555', textAlign: 'center' }}>
          {isMyWin ? 'Congratulations!' : `${winner.name} wins!`}
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 1, color: '#888', textTransform: 'uppercase' }}>
        Final Scores
      </div>

      <div className="final-scores">
        {finalScores?.map((entry, idx) => (
          <div
            key={entry.id}
            className={`final-score-row ${idx === 0 ? 'winner-row' : ''}`}
          >
            <div className="final-score-rank">
              {idx === 0 ? '🏆' : `${idx + 1}`}
            </div>
            <div className="final-score-name">
              {entry.name}
              {entry.id === myId && <span style={{ color: '#888', fontWeight: 'normal', fontSize: 13 }}> (you)</span>}
            </div>
            <div className="final-score-pts">
              {entry.score} pt{entry.score !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => window.location.reload()}
        style={{ marginTop: 12, fontSize: 16, padding: '12px 28px' }}
      >
        Play Again
      </button>
    </div>
  );
}
