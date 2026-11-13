import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
const demo = { requisition: { title: 'Backend Engineer' }, stages: [
  { stage: 'Applied', candidates: [{ id: 'c1', name: 'Ada' }, { id: 'c3', name: 'Cy' }] },
  { stage: 'Screen', candidates: [{ id: 'c2', name: 'Ben' }] },
  { stage: 'Interview', candidates: [] }, { stage: 'Offer', candidates: [] }, { stage: 'Hired', candidates: [] }] };
function App() {
  const [board, setBoard] = useState(demo); const [role, setRole] = useState('recruiter');
  useEffect(() => { fetch('http://localhost:3001/api/board/req-1', { headers: { 'x-role': role } }).then(r => r.ok ? r.json() : Promise.reject()).then(setBoard).catch(() => setBoard(demo)); }, [role]);
  const move = async (id) => { await fetch(`http://localhost:3001/api/candidates/${id}/move`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-role': role, 'x-user': 'demo' }, body: JSON.stringify({ to: 'Interview' }) }).catch(() => {}); };
  return <main style={{ fontFamily: 'system-ui', padding: 24 }}><h1>Hiring Workflow — {board.requisition.title}</h1>
    <label>Role <select data-testid="role" value={role} onChange={e => setRole(e.target.value)}><option>admin</option><option>recruiter</option><option>hiring_manager</option><option>interviewer</option><option>viewer</option></select></label>
    <div style={{ display: 'flex', gap: 12, marginTop: 16, overflowX: 'auto' }}>{board.stages.map(s => <section key={s.stage} data-testid={`stage-${s.stage}`} style={{ minWidth: 180, background: '#f4f4f5', padding: 12, borderRadius: 8 }}><h2>{s.stage} ({s.candidates.length})</h2>{s.candidates.map(c => <article key={c.id} style={{ background: '#fff', padding: 8, marginBottom: 8 }}><span>{c.name}</span> <button onClick={() => move(c.id)}>Move →</button></article>)}</section>)}</div></main>;
}
createRoot(document.getElementById('root')).render(<App />);
