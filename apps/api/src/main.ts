import 'reflect-metadata';
import { Module, Controller, Get, Post, Put, Body, Param, Headers, ForbiddenException, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// @ts-ignore plain-JS core package
import { rankCandidates } from '../../../packages/core/src/ranking.js';
// @ts-ignore
import { can, DEFAULT_STAGES, AuditLog, JobQueue } from '../../../packages/core/src/workflow.js';

const audit = new AuditLog(); const queue = new JobQueue(); const sent: any[] = [];
queue.register('email', async (p: any) => { sent.push({ kind: 'email', ...p }); });
queue.register('schedule', async (p: any) => { sent.push({ kind: 'schedule', ...p }); });

@Injectable() class Store {
  stages = [...DEFAULT_STAGES];
  requisitions = [{ id: 'req-1', title: 'Backend Engineer', stages: [...DEFAULT_STAGES], jobText: 'typescript nestjs node postgres aws docker sql' }];
  candidates = [
    { id: 'c1', name: 'Ada', requisitionId: 'req-1', stage: 'Applied', resumeText: 'typescript nestjs node postgres aws 6 years' },
    { id: 'c2', name: 'Ben', requisitionId: 'req-1', stage: 'Screen', resumeText: 'react javascript css 3 years' },
    { id: 'c3', name: 'Cy', requisitionId: 'req-1', stage: 'Applied', resumeText: 'python django sql 4 years' },
  ];
}
function guard(role: string, action: string) { if (!can(role || 'viewer', action)) throw new ForbiddenException(`${role} cannot ${action}`); }

@Controller('api') class AppController {
  constructor(private s: Store) {}
  @Get('health') health() { return { ok: true }; }
  @Get('board/:reqId') board(@Param('reqId') id: string, @Headers('x-role') role = 'viewer') {
    guard(role, 'candidate:read');
    const req = this.s.requisitions.find(r => r.id === id) || this.s.requisitions[0];
    return { requisition: req, stages: req.stages.map((stage: string) => ({ stage, candidates: this.s.candidates.filter(c => c.requisitionId === req.id && c.stage === stage) })) };
  }
  @Put('requisitions/:id/stages') stages(@Param('id') id: string, @Body() b: any, @Headers('x-role') role = 'viewer', @Headers('x-user') user = 'anon') {
    guard(role, 'requisition:*'); const req = this.s.requisitions.find(r => r.id === id); if (req) req.stages = b.stages;
    audit.record(user, 'stages.update', id, { stages: b.stages }); return req;
  }
  @Post('candidates/:id/move') async move(@Param('id') id: string, @Body() b: any, @Headers('x-role') role = 'viewer', @Headers('x-user') user = 'anon') {
    guard(role, 'candidate:move'); const c: any = this.s.candidates.find(x => x.id === id); if (!c) return { error: 'not found' };
    const from = c.stage; c.stage = b.to; audit.record(user, 'candidate.move', id, { from, to: b.to });
    queue.send('email', { to: c.name, template: 'stage-moved', stage: b.to }); queue.send('schedule', { candidateId: id, stage: b.to }); await queue.drain();
    return c;
  }
  @Get('rank/:reqId') rank(@Param('reqId') id: string, @Headers('x-role') role = 'viewer') {
    guard(role, 'candidate:read'); const req = this.s.requisitions.find(r => r.id === id) || this.s.requisitions[0];
    return rankCandidates(req.jobText, this.s.candidates.filter(c => c.requisitionId === req.id));
  }
  @Get('audit') auditList(@Headers('x-role') role = 'viewer') { guard(role, 'candidate:read'); return audit.list(); }
  @Get('jobs/sent') jobs() { return sent; }
}
@Module({ controllers: [AppController], providers: [Store] }) class AppModule {}
async function bootstrap() { const app = await NestFactory.create(AppModule); app.enableCors(); await app.listen(process.env.PORT || 3001); }
if (require.main === module) bootstrap();
export { AppModule };
