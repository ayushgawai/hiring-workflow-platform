import { spawn } from 'node:child_process';
const p = spawn('node', ['apps/api/dist/apps/api/src/main.js'], { stdio: 'inherit' });
await new Promise(r => setTimeout(r, 2000));
for (const [path, role] of [['/api/health','viewer'],['/api/board/req-1','recruiter'],['/api/rank/req-1','recruiter'],['/api/board/req-1','viewer']]) {
  const res = await fetch('http://localhost:3001' + path, { headers: { 'x-role': role } });
  console.log(path, role, res.status, (await res.text()).slice(0, 300));
}
p.kill(); process.exit(0);
