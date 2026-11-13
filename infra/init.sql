CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE requisitions(id TEXT PRIMARY KEY, title TEXT, stages JSONB, job_embedding vector(64));
CREATE TABLE applications(id BIGSERIAL PRIMARY KEY, requisition_id TEXT REFERENCES requisitions(id), candidate_id TEXT, stage TEXT, embedding vector(64), created_at TIMESTAMPTZ DEFAULT now());
-- The composite index measured in bench/ (SQLite analogue):
CREATE INDEX idx_board ON applications(requisition_id, stage, created_at DESC);
CREATE INDEX idx_emb ON applications USING ivfflat (embedding vector_cosine_ops) WITH (lists=100);
CREATE TABLE audit_log(id BIGSERIAL PRIMARY KEY, actor TEXT, action TEXT, entity TEXT, detail JSONB, ts TIMESTAMPTZ DEFAULT now());
