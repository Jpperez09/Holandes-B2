import React, { useState } from 'react';

interface HealthResponse {
  ok: boolean;
  ts: string;
}

export default function App(): React.JSX.Element {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkHealth(): Promise<void> {
    setError(null);
    try {
      const res = await fetch('/api/health');
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Hello, Dutch B2</h1>
      <p>Your personal Dutch learning system is running.</p>

      <button
        onClick={() => void checkHealth()}
        style={{
          padding: '0.5rem 1.25rem',
          fontSize: '1rem',
          cursor: 'pointer',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Check API health
      </button>

      {health && (
        <pre style={{ marginTop: '1rem', background: '#f3f4f6', padding: '1rem', borderRadius: '4px' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>
      )}
    </div>
  );
}
