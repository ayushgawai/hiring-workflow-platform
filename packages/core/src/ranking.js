// Deterministic hash embeddings: stand-in for pgvector text-embedding model.
// Same math interface (embed -> cosine rank); swap embed() for a real model call.
export function embed(text, dim = 64) {
  const v = new Float64Array(dim);
  for (const tok of String(text).toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean)) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) { h ^= tok.charCodeAt(i); h = Math.imul(h, 16777619); }
    v[Math.abs(h) % dim] += 1; v[Math.abs(h >> 8) % dim] += 0.5; // bigram-ish spread
  }
  const n = Math.hypot(...v) || 1; return [...v].map(x => x / n);
}
export const cosine = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

// LLM structured-output mock: extracts required JSON fields, validates shape.
// Real deployment: prompt an LLM with a JSON schema and validate identically.
export function structuredExtract(resumeText) {
  const t = String(resumeText).toLowerCase();
  const skills = ['javascript','typescript','react','nestjs','node','python','postgres','aws','docker','kubernetes','go','java','sql','graphql','redis','kafka'].filter(s => t.includes(s));
  const yrs = (String(resumeText).match(/(\d+)\+?\s*years?/) || [])[1];
  const out = { skills, yearsExperience: yrs ? +yrs : 0, seniority: yrs >= 7 ? 'senior' : yrs >= 3 ? 'mid' : 'junior' };
  if (!Array.isArray(out.skills) || typeof out.yearsExperience !== 'number') throw new Error('invalid structured output');
  return out;
}

export function rankCandidates(jobText, candidates) {
  const j = embed(jobText);
  return candidates.map(c => ({ ...c, score: +cosine(j, embed(c.resumeText || c.text || '')).toFixed(4), extracted: structuredExtract(c.resumeText || c.text || '') }))
    .sort((a, b) => b.score - a.score);
}

export function recallAtK(rankedIds, relevantIds, k = 10) {
  const rel = new Set(relevantIds); if (!rel.size) return 0;
  return rankedIds.slice(0, k).filter(id => rel.has(id)).length / rel.size;
}
