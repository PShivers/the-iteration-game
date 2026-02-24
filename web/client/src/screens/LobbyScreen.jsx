import { socket } from '../socket';
import PlayerList from '../components/PlayerList';
import RoomCode from '../components/RoomCode';

export default function LobbyScreen({ roomCode, players, isHost, myId }) {
  function handleStart() {
    socket.emit('c:startGame');
  }

  const canStart = isHost && players.length >= 3;

  return (
    <div className="lobby-screen">
      <div className="screen-title">WAITING ROOM</div>

      <div className="lobby-room-code">
        <RoomCode code={roomCode} />
        <div className="lobby-hint" style={{ marginTop: 8 }}>
          Share this code with teammates
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: 1, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>
          Players ({players.length})
        </div>
        <PlayerList players={players} myId={myId} />
      </div>

      {isHost ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={!canStart}
            style={{ fontSize: 18, padding: '14px 32px' }}
          >
            Start Game
          </button>
          {players.length < 3 && (
            <div className="screen-subtitle">
              Need at least {3 - players.length} more player{players.length < 2 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        <div className="screen-subtitle">Waiting for the host to start the game...</div>
      )}
    </div>
  );
}
