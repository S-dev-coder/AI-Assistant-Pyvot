# Conversational BI Assistant

Ask business questions about an ecommerce dataset in plain English — get back a text
summary, a table, and/or a chart. Natural language → LLM-generated SQL (RAG-grounded)
→ PostgreSQL → formatted answer. If a question is ambiguous the assistant asks up to
3 clarifying questions, then replies exactly:
*"I am unable to understand the query. Please rephrase the query or ask another different query"*.

## Architecture

```
Browser ──> Next.js 16 + shadcn/ui (:3000)        chat UI, tables, recharts
               │  /api/backend/* rewrite
               ▼
            Node.js Express (:5050)               sessions, proxy, CORS
               │
               ▼
            Python FastAPI AI service (:8000)     6-stage pipeline:
               │   guardrail → clarity check → SQL generator (RAG)
               │   → sqlglot validator → executor → formatter
               ├──> LLM: Ollama Cloud API (glm-4.7), OpenAI-compatible, env-swappable
               ▼
            PostgreSQL 18 `ecommerce_bi`          bi_readonly role (SELECT-only,
                                                  read-only txns, 10s timeout)
```

Public URL: an ngrok tunnel pointed at :3000 (free tier).

## Dataset

4 tables from `ecommerce_dataset_postgres.sql`: customers (400), products (90),
orders (4,000), order_items (7,237). All dates are shifted at load time so the
newest order is 2 days old — "last month" style questions return real data.

## Setup (one time)

```bash
# 1. database (PostgreSQL must be running)
./scripts/setup_db.sh path/to/ecommerce_dataset_postgres.sql

# 2. AI service
cd ai-service && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt
cp .env.example .env   # then set LLM_BASE_URL / LLM_MODEL / LLM_API_KEY

# 3. backend & frontend
cd ../backend && npm install
cd ../frontend && npm install && npm run build
```

`.env` (never committed) — any OpenAI-compatible provider works:

```
LLM_BASE_URL=https://ollama.com/v1      # or https://api.groq.com/openai/v1, ...
LLM_MODEL=glm-4.7:cloud
LLM_API_KEY=<your key>
DATABASE_URL=postgresql://bi_readonly:bi_readonly_local@localhost:5432/ecommerce_bi
```

## Run

```bash
./scripts/start_all.sh    # starts all 3 services + ngrok tunnel, prints the public URL
./scripts/stop_all.sh
```

## Working example queries

1. What was our total revenue last month?
2. Top 5 products by revenue
3. Monthly revenue trend for this year
4. Which category is most profitable?
5. How many customers do we have in each country?
6. Average order value by customer segment
7. What share of orders got cancelled?
8. Top 3 cities by number of orders in India
9. How much revenue did we lose to discounts this year?
10. Show me the best customers  ← ambiguous on purpose: triggers a clarifying question
11. What will the weather be tomorrow?  ← out of scope: exact fallback message

## Safety

- The LLM only ever *writes* SQL; it never executes anything and never computes numbers.
- Three independent write-defenses: sqlglot AST validation (single SELECT-only
  statement, known tables/columns, LIMIT cap) + `bi_readonly` role with SELECT-only
  grants + `default_transaction_read_only=on`.
- One self-repair retry: validation/DB errors are fed back to the generator once.
- Design doc: see `Conversational-BI-Assistant-HLD-LLD.md` (HLD, LLD, sequence diagrams).
