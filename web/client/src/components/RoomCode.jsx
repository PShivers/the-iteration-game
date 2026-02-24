import { useState } from 'react';

export default function RoomCode({ code }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="room-code" onClick={handleCopy} style={{ cursor: 'pointer' }} title="Click to copy">
      <span className="room-code-label">Room</span>
      <span className="room-code-value">{code || '----'}</span>
      {copied && <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 'bold' }}>Copied!</span>}
    </div>
  );
}
