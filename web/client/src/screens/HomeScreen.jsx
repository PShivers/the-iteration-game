import { useState } from 'react';
import { socket } from '../socket';

export default function HomeScreen({ myName, onSetName }) {
  const [name, setName] = useState(myName || '');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSetName(trimmed);
    socket.emit('c:createRoom', { playerName: trimmed });
  }

  function handleJoin() {
    const trimmed = name.trim();
    const code = joinCode.trim().toUpperCase();
    if (!trimmed || !code) return;
    onSetName(trimmed);
    socket.emit('c:joinRoom', { roomCode: code, playerName: trimmed });
  }

  function handleKeyDown(e, action) {
    if (e.key === 'Enter') action();
  }

  const nameValid = name.trim().length > 0;
  const joinValid = nameValid && joinCode.trim().length === 4;

  return (
    <div className="screen">
      <div style={{ textAlign: 'center' }}>
        <div className="screen-title">ITERATION REVIEW</div>
        <div className="screen-title" style={{ color: '#1A1A1A', fontSize: 20 }}>CARD GAME</div>
        <div className="screen-subtitle" style={{ marginTop: 8 }}>
          A Metagame-style card game for agile teams
        </div>
      </div>

      <div className="form-group">
        <label>Your name</label>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => handleKeyDown(e, () => mode === 'join' ? handleJoin() : handleCreate())}
          maxLength={20}
          autoFocus
        />
      </div>

      {mode === null && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => setMode('create')}
            disabled={!nameValid}
          >
            Create Room
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setMode('join')}
            disabled={!nameValid}
          >
            Join Room
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!nameValid}>
            Create Game
          </button>
          <button className="btn btn-secondary" onClick={() => setMode(null)}>
            Back
          </button>
          <div className="screen-subtitle">You'll get a room code to share with teammates.</div>
        </div>
      )}

      {mode === 'join' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="form-group">
            <label>Room code</label>
            <input
              type="text"
              placeholder="ABCD"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, handleJoin)}
              maxLength={4}
              style={{ textAlign: 'center', letterSpacing: 4, fontSize: 22, fontWeight: 'bold' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleJoin} disabled={!joinValid}>
            Join Game
          </button>
          <button className="btn btn-secondary" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      )}

      <div className="screen-subtitle" style={{ marginTop: 8, maxWidth: 320 }}>
        Need at least 3 players. One player judges each round — the others submit culture cards.
        Judge picks their favourite. 10 rounds total.
      </div>
    </div>
  );
}
