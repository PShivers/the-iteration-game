export default function PlayerList({ players, myId, hostId }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="player-list">
      {players.map((p, idx) => (
        <div
          key={p.id}
          className={['player-list-item', p.id === myId && 'is-me'].filter(Boolean).join(' ')}
        >
          <span className="player-name">{p.name}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {p.id === myId && <span className="player-tag">you</span>}
            {(p.id === hostId || idx === 0) && <span className="player-tag">host</span>}
            {!p.connected && <span className="player-tag" style={{ color: '#C0392B' }}>away</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
