// Conversation persistence: a JSON file on disk. Survives restarts, zero setup.
// (The BI database stays read-only by design — app state does not belong there.)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const FILE = path.join(DATA_DIR, 'conversations.json');

let conversations = {};

export function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  try {
    conversations = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    conversations = {};
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(conversations, null, 1));
}

export function list() {
  return Object.values(conversations)
    .map(({ id, title, updatedAt, messages }) => ({
      id,
      title,
      updatedAt,
      messageCount: messages.length,
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function get(id) {
  return conversations[id] ?? null;
}

export function create(id, sessionId, firstQuestion) {
  const now = new Date().toISOString();
  conversations[id] = {
    id,
    sessionId,
    title: firstQuestion.length > 60 ? `${firstQuestion.slice(0, 57)}…` : firstQuestion,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  save();
  return conversations[id];
}

export function appendMessages(id, newMessages) {
  const conv = conversations[id];
  if (!conv) return;
  conv.messages.push(...newMessages);
  conv.updatedAt = new Date().toISOString();
  save();
}

export function remove(id) {
  const existed = id in conversations;
  delete conversations[id];
  if (existed) save();
  return existed;
}

// Full conversation transcript for the AI service. The LLM has a 200k-token
// context window, so we send everything (summaries + SQL, not raw result rows)
// and only trim the OLDEST turns if the transcript exceeds ~100k characters.
export function transcript(id, maxChars = 100_000) {
  const conv = conversations[id];
  if (!conv) return [];

  const turns = conv.messages.map((m) => {
    if (m.role === 'user') return { role: 'user', text: m.text ?? '' };
    const c = m.content ?? {};
    let text = '';
    if (c.type === 'answer') {
      text = c.summary ?? '';
      if (c.sql) text += `\n[SQL used: ${c.sql}]`;
      if (Array.isArray(c.rows) && c.columns?.length) {
        text += `\n[query returned ${c.rows.length} rows with columns: ${c.columns.join(', ')}]`;
      }
    } else if (c.type === 'clarification') {
      text = `(asked a clarifying question) ${c.question ?? ''}`;
    } else {
      text = `(${c.type}) ${c.message ?? ''}`;
    }
    return { role: 'assistant', text };
  });

  let total = 0;
  const kept = [];
  for (let i = turns.length - 1; i >= 0; i--) {
    total += turns[i].text.length;
    if (total > maxChars) break;
    kept.unshift(turns[i]);
  }
  return kept;
}
