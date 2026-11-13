import { describe, it, expect } from 'vitest';
import { embed, cosine, rankCandidates, recallAtK, structuredExtract } from '../packages/core/src/ranking.js';
import { can, AuditLog, JobQueue, DEFAULT_STAGES } from '../packages/core/src/workflow.js';

describe('ranking', () => {
  it('ranks matching resume first', () => {
    const r = rankCandidates('typescript nestjs postgres', [
      { id: 'a', resumeText: 'typescript nestjs postgres aws 5 years' },
      { id: 'b', resumeText: 'cooking gardening painting' }]);
    expect(r[0].id).toBe('a'); expect(r[0].score).toBeGreaterThan(r[1].score);
  });
  it('recall@10', () => { expect(recallAtK(['1','2','3'], ['1','2'], 10)).toBe(1); expect(recallAtK(['9'], ['1'], 10)).toBe(0); });
  it('structured extract validates', () => { expect(structuredExtract('React TypeScript 6 years').skills).toContain('react'); expect(structuredExtract('x 6 years').seniority).toBe('mid'); });
  it('embeddings normalized', () => { expect(Math.hypot(...embed('hello world'))).toBeCloseTo(1); expect(cosine(embed('a b'), embed('a b'))).toBeCloseTo(1); });
});
describe('rbac/audit/queue', () => {
  it('rbac', () => { expect(can('admin','anything')).toBe(true); expect(can('viewer','candidate:move')).toBe(false); expect(can('recruiter','candidate:move')).toBe(true); expect(can('nobody','candidate:read')).toBe(false); });
  it('audit records', () => { const a = new AuditLog(); a.record('u1','candidate.move','c1',{from:'Applied',to:'Screen'}); expect(a.list('c1')).toHaveLength(1); });
  it('queue drains email+schedule with retries', async () => {
    const q = new JobQueue(); const seen = []; q.register('email', async p => seen.push(p));
    q.send('email', { to: 'Ada' }); expect(await q.drain()).toBe(1); expect(seen).toHaveLength(1);
    expect(DEFAULT_STAGES).toContain('Offer');
  });
});
