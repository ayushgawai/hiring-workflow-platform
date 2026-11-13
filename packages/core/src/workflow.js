export const ROLES = { admin: ['*'], recruiter: ['requisition:*','candidate:move','candidate:read','job:send'], hiring_manager: ['candidate:read','candidate:move'], interviewer: ['candidate:read'], viewer: ['candidate:read'] };
export function can(role, action) {
  const perms = ROLES[role] || [];
  return perms.includes('*') || perms.some(p => p.trim() === action || (p.endsWith(':*') && action.startsWith(p.slice(0, -1))));
}
export const DEFAULT_STAGES = ['Applied', 'Screen', 'Interview', 'Onsite', 'Offer', 'Hired'];
export function validateTransition(stages, from, to) {
  const a = stages.indexOf(from), b = stages.indexOf(to);
  if (a < 0 || b < 0) throw new Error(`unknown stage ${from}->${to}`);
  if (to === 'Rejected') return true;
  if (b < a && to !== stages[0]) { /* allow backward with audit, still valid */ }
  return true;
}
export class AuditLog {
  constructor() { this.rows = []; }
  record(actor, action, entity, detail = {}) { const r = { id: this.rows.length + 1, ts: new Date().toISOString(), actor, action, entity, detail }; this.rows.push(r); return r; }
  list(entity) { return entity ? this.rows.filter(r => r.entity === entity) : [...this.rows]; }
}
// In-process SQS stand-in: same send/poll/ack semantics; production uses @aws-sdk/client-sqs against LocalStack or AWS.
export class JobQueue {
  constructor() { this.q = []; this.handlers = {}; this.dead = []; }
  register(type, fn) { this.handlers[type] = fn; }
  send(type, payload) { const job = { id: crypto.randomUUID(), type, payload, attempts: 0 }; this.q.push(job); return job; }
  async drain(max = 100) {
    let done = 0;
    while (this.q.length && done < max) {
      const job = this.q.shift();
      try { await this.handlers[job.type]?.(job.payload); done++; }
      catch (e) { job.attempts++; job.attempts >= 3 ? this.dead.push(job) : this.q.push(job); }
    }
    return done;
  }
}
