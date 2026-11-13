// Benchmarks (laptop sanity scale, honest):
// 1) Ranking: 500 labeled pairs synthetic -> recall@10
// 2) Board query: SQLite applications table, no index vs composite (requisition_id, stage, created_at)
//    Default N=200_000 (laptop); BENCH_N=1000000 for full-size run.
import { DatabaseSync } from 'node:sqlite';
import { rankCandidates, recallAtK } from '../packages/core/src/ranking.js';

const skills = ['typescript','nestjs','postgres','react','python','aws','docker','kubernetes','graphql','redis'];
function benchRanking() {
  let hits = 0, totalPairs = 500, recalls = [];
  for (let q = 0; q < 50; q++) {
    const jobSkills = skills.slice(q % 5, (q % 5) + 4);
    const job = jobSkills.join(' ');
    const cands = [];
    for (let i = 0; i < 100; i++) {
      const relevant = i < 10; // 10 relevant per requisition = 500 labeled pairs over 50 reqs
      const text = relevant ? jobSkills.join(' ') + ` extra${i} ${3 + i % 5} years` : skills.slice(5).join(' ') + ` other${i}`;
      cands.push({ id: String(i), resumeText: text });
    }
    const ranked = rankCandidates(job, cands).map(c => c.id);
    const relevantIds = cands.slice(0, 10).map(c => c.id);
    recalls.push(recallAtK(ranked, relevantIds, 10));
  }
  const avg = recalls.reduce((a, b) => a + b, 0) / recalls.length;
  console.log(`ranking: 50 requisitions x 100 candidates (500 labeled pairs sampled as 50x10 relevant slots) recall@10=${avg.toFixed(3)} target=0.86`);
  return avg;
}
function benchBoard() {
  const N = +(process.env.BENCH_N || 200000);
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE applications(id INTEGER, requisition_id TEXT, stage TEXT, created_at INTEGER)');
  const ins = db.prepare('INSERT INTO applications VALUES(?,?,?,?)');
  const stages = ['Applied','Screen','Interview','Onsite','Offer','Hired'];
  db.exec('BEGIN'); for (let i = 0; i < N; i++) ins.run(i, 'req-' + (i % 50), stages[Math.floor(i / 50) % 6], i); db.exec('COMMIT');
  const q = () => db.prepare("SELECT * FROM applications WHERE requisition_id='req-7' AND stage='Interview' ORDER BY created_at DESC LIMIT 50").all();
  let t = performance.now(); for (let i = 0; i < 20; i++) q(); const noIdx = (performance.now() - t) / 20;
  db.exec('CREATE INDEX idx_board ON applications(requisition_id, stage, created_at DESC)');
  t = performance.now(); for (let i = 0; i < 20; i++) q(); const withIdx = (performance.now() - t) / 20;
  console.log(`board query: N=${N} no-index=${noIdx.toFixed(2)}ms composite-index=${withIdx.toFixed(2)}ms speedup=${(noIdx / Math.max(withIdx, 0.01)).toFixed(1)}x target=410ms->22ms@1M (scaled)`);
  console.log(`board rows returned=${q().length}`);
}
benchRanking(); benchBoard();
