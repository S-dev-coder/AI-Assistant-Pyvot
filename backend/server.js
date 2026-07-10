import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const AI_SERVICE_URL = 'http://127.0.0.1:8000';
const PORT = process.env.PORT || 5050;

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

// Query proxy: manages session ids, forwards to the AI service verbatim
app.post('/api/query', async (req, res) => {
  const { sessionId: incomingSessionId, question } = req.body ?? {};

  if (typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ type: 'error', message: 'question is required' });
  }

  const sessionId = incomingSessionId || uuidv4();

  try {
    const upstream = await fetch(`${AI_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, question }),
      signal: AbortSignal.timeout(90000),
    });

    const body = await upstream.json();
    res.status(upstream.status).json({ ...body, sessionId });
  } catch {
    res.status(502).json({ type: 'error', message: 'AI service unavailable', sessionId });
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
