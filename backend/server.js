import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import * as store from './store.js';

store.init();

const AI_SERVICE_URL = 'http://127.0.0.1:8000';
const PORT = process.env.PORT || 5050;

// Return DATE/TIMESTAMP columns as plain strings — JS Date conversion shifts
// them by the local timezone offset (IST) and displays dates one day early.
pg.types.setTypeParser(1082, (v) => v); // DATE      -> 'YYYY-MM-DD'
pg.types.setTypeParser(1114, (v) => v); // TIMESTAMP -> 'YYYY-MM-DD HH:MM:SS'

// Same read-only role the AI service uses — the browser endpoints can never write.
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://bi_readonly:bi_readonly_local@localhost:5432/ecommerce_bi',
  max: 5,
});

// Only these tables are ever interpolated into SQL (whitelist, no user input).
const TABLES = ['customers', 'products', 'orders', 'order_items'];

const app = express();

app.use(cors());
app.use(express.json());

// Request logger: method, path, duration in ms
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Health check: reports whether the AI service is reachable
app.get('/api/health', async (req, res) => {
  let aiService = 'down';
  try {
    const r = await fetch(`${AI_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) aiService = 'up';
  } catch {
    // AI service unreachable or timed out
  }
  res.json({ status: 'ok', aiService });
});

// Query proxy: manages session + conversation ids, forwards to the AI service,
// persists every exchange so a conversation can be resumed later
app.post('/api/query', async (req, res) => {
  const { sessionId: incomingSessionId, conversationId: incomingConvId, question } = req.body ?? {};

  if (typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ type: 'error', message: 'question is required' });
  }

  const existing = incomingConvId ? store.get(incomingConvId) : null;
  const sessionId = existing?.sessionId || incomingSessionId || uuidv4();
  const conversationId = existing?.id || uuidv4();
  if (!existing) store.create(conversationId, sessionId, question.trim());

  try {
    const upstream = await fetch(`${AI_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question,
        chat_history: store.transcript(conversationId),
      }),
      // 3 LLM calls per answer; long conversations make each call slower.
      // Must stay below the frontend proxy timeout (180s).
      signal: AbortSignal.timeout(150000),
    });

    const body = await upstream.json();
    store.appendMessages(conversationId, [
      { role: 'user', text: question.trim() },
      { role: 'assistant', content: body },
    ]);
    res.status(upstream.status).json({ ...body, sessionId, conversationId });
  } catch {
    res.status(502).json({ type: 'error', message: 'AI service unavailable', sessionId, conversationId });
  }
});

// Conversation history
app.get('/api/conversations', (req, res) => {
  res.json({ conversations: store.list() });
});

app.get('/api/conversations/:id', (req, res) => {
  const conv = store.get(req.params.id);
  if (!conv) return res.status(404).json({ type: 'error', message: 'unknown conversation' });
  res.json(conv);
});

app.delete('/api/conversations/:id', (req, res) => {
  const existed = store.remove(req.params.id);
  res.status(existed ? 200 : 404).json({ deleted: existed });
});

// Data explorer: list tables with row counts
app.get('/api/tables', async (req, res, next) => {
  try {
    const counts = await Promise.all(
      TABLES.map((t) => pool.query(`SELECT count(*)::int AS n FROM ${t}`)),
    );
    res.json({
      tables: TABLES.map((name, i) => ({ name, rowCount: counts[i].rows[0].n })),
    });
  } catch (err) {
    next(err);
  }
});

// Data explorer: paginated rows of one whitelisted table
app.get('/api/tables/:name', async (req, res, next) => {
  const { name } = req.params;
  if (!TABLES.includes(name)) {
    return res.status(404).json({ type: 'error', message: 'unknown table' });
  }
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  try {
    const r = await pool.query(`SELECT * FROM ${name} ORDER BY 1 LIMIT $1 OFFSET $2`, [
      limit,
      offset,
    ]);
    res.json({
      table: name,
      columns: r.fields.map((f) => f.name),
      rows: r.rows.map((row) => r.fields.map((f) => row[f.name])),
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ type: 'error', message: 'internal error' });
});

app.listen(PORT, () => {
  console.log(`bi-backend listening on port ${PORT}`);
});
