"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient"
import { MermaidDiagram } from "@/components/mermaid-diagram"

const REPO_URL = "https://github.com/S-dev-coder/AI-Assistant-Pyvot"

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const STACK_BADGES = [
  ["Next.js 16 + shadcn/ui", "rich chat UI, tables & charts out of the box"],
  ["Node.js Express", "thin API gateway: sessions, history, proxying"],
  ["Python FastAPI", "AI pipeline — best ecosystem for LLM + SQL tooling"],
  ["PostgreSQL 18", "real production engine with a read-only role"],
  ["GLM-4.7 · Ollama Cloud", "free-tier LLM, OpenAI-compatible & swappable"],
]

const SERVICES_CHART = `
flowchart LR
    U["User's browser"] -->|HTTPS| NG["ngrok tunnel<br/>permanent domain"]
    NG --> FE["Next.js 16 + shadcn/ui<br/>chat · charts · data explorer<br/>:3000"]
    FE -->|"/api/backend/*"| BE["Node.js Express<br/>sessions · history · proxy<br/>:5050"]
    BE -->|"POST /ask<br/>+ full transcript"| AI["Python FastAPI<br/>6-stage AI pipeline<br/>:8000"]
    BE -->|"data explorer<br/>SELECTs"| DB[("PostgreSQL 18<br/>ecommerce_bi")]
    BE --- HS[("conversations.json<br/>chat history store")]
    AI -->|"3 LLM calls<br/>per answer"| LLM["GLM-4.7<br/>Ollama Cloud API<br/>(OpenAI-compatible)"]
    AI -->|"validated SQL<br/>bi_readonly role"| DB
`

const PIPELINE_CHART = `
flowchart TD
    Q["User question"] --> G{"1 · Guardrail<br/>regex checks — no LLM cost"}
    G -->|reject| GR["Polite rejection"]
    G -->|pass| C{"2 · Clarity checker<br/>LLM call #1"}
    C -->|CONVERSATIONAL| CA["Answer from chat context<br/>no SQL, no database"]
    C -->|IMPOSSIBLE| F["EXACT fallback message"]
    C -->|"AMBIGUOUS<br/>&lt; 3 asked"| CQ["Ask ONE clarifying question"]
    CQ --> W["User replies"]
    W --> C
    C -->|"AMBIGUOUS<br/>3 already asked"| F
    C -->|CLEAR| GEN["3 · SQL Generator<br/>LLM call #2 — RAG-grounded"]
    GEN --> V{"4 · Validator<br/>sqlglot AST checks"}
    V -->|fail| R{"retry budget left?"}
    R -->|"yes — error<br/>fed back"| GEN
    R -->|no| E["Graceful error"]
    V -->|pass| X["5 · Executor<br/>read-only PostgreSQL, 10s timeout"]
    X -->|SQL error| R
    X -->|rows| FMT["6 · Formatter<br/>shape by code · summary by LLM call #3"]
    FMT --> OUT["Text summary + table + chart<br/>+ collapsible View SQL"]
`

const SEQUENCE_CHART = `
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js UI
    participant BE as Express backend
    participant AI as FastAPI pipeline
    participant LLM as GLM-4.7
    participant DB as PostgreSQL (bi_readonly)
    U->>FE: natural-language question
    FE->>BE: POST /api/query {sessionId, conversationId, question}
    BE->>AI: POST /ask {question + full conversation transcript}
    AI->>LLM: clarity check (LLM call #1)
    alt ambiguous (max 3 times)
        AI-->>FE: ONE clarifying question
        FE-->>U: shown as chat bubble
    else clear
        AI->>LLM: generate SQL (LLM call #2, RAG-grounded)
        AI->>AI: validate — single SELECT, known columns, LIMIT cap
        AI->>DB: execute validated SQL (read-only)
        DB-->>AI: result rows
        AI->>LLM: summarize shown rows (LLM call #3)
        AI-->>BE: answer {summary, sql, rows, chart spec}
        BE->>BE: persist exchange to history store
        BE-->>FE: response + sessionId + conversationId
        FE-->>U: text + table + chart + View SQL
    end
`

const ER_CHART = `
erDiagram
    customers ||--o{ orders : "places"
    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "appears in"
    customers {
        int customer_id PK
        varchar name
        varchar email
        varchar city
        varchar country
        varchar segment
        date signup_date
    }
    products {
        int product_id PK
        varchar product_name
        varchar category
        varchar subcategory
        numeric unit_cost
        numeric unit_price
    }
    orders {
        int order_id PK
        int customer_id FK
        timestamp order_date
        varchar status
        varchar payment_method
    }
    order_items {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        numeric unit_price
        numeric discount_pct
    }
`

const RAG_CHART = `
flowchart LR
    Q["User question"] --> R["RETRIEVE<br/>schema.md · glossary.md · examples.json"]
    R --> A["AUGMENT<br/>prompt = knowledge + transcript + question"]
    A --> G["GENERATE<br/>LLM writes grounded SQL"]
    G --> S["One validated SELECT"]
`

const TECH_ROWS = [
  [
    "Frontend",
    "Next.js 16 · shadcn/ui · recharts · Animate UI",
    "Chat UI with tables, charts, chat history sidebar, and a full data explorer — production-grade UX on the App Router.",
  ],
  [
    "Backend",
    "Node.js Express",
    "Thin by design: session ids, conversation persistence, whitelisted data-explorer endpoints, proxy. No business logic.",
  ],
  [
    "AI service",
    "Python FastAPI",
    "The 6-stage pipeline. Python for the AI ecosystem: sqlglot for AST validation, psycopg for Postgres.",
  ],
  [
    "LLM",
    "GLM-4.7 via Ollama Cloud (OpenAI-compatible)",
    "Provider is 3 env vars (base URL, model, key) — swappable to Groq/Gemini/OpenAI with zero code change. temperature=0 for reproducible SQL.",
  ],
  [
    "Database",
    "PostgreSQL 18, ecommerce_bi",
    "Real production-grade engine; dedicated bi_readonly role makes writes impossible at the database level.",
  ],
  [
    "Chat memory",
    "JSON file store (backend)",
    "Conversations survive restarts and are resumable; kept OUT of the BI database so it stays strictly read-only.",
  ],
  [
    "Deployment",
    "Local three-service run + permanent ngrok domain",
    "Free, publicly testable URL that survives restarts.",
  ],
]

const SAFETY_ROWS = [
  [
    "1 · sqlglot AST validation",
    "Parses generated SQL; rejects anything that isn't a single SELECT, any unknown table/column, and injects a hard LIMIT cap.",
  ],
  [
    "2 · bi_readonly role",
    "The only account the app uses. GRANT SELECT only — INSERT/UPDATE/DELETE/DDL fail at the database, no matter what SQL slips through.",
  ],
  [
    "3 · Read-only transactions",
    "default_transaction_read_only=on plus a 10-second statement_timeout at the role level, and the connection itself opens read-only.",
  ],
]

// Expected outputs verified against the live database (July 2026 — the two
// date-relative queries shift as the calendar moves).
const EXAMPLE_QUERIES: [string, string, string][] = [
  [
    "What was our total revenue last month?",
    "KPI card counting up to 146,815.25 with the summary “Total revenue was 146,815.25.”",
    "text (KPI)",
  ],
  [
    "Top 5 products by revenue",
    "Decor - Board Lite 2,147,525.74 · Footwear - Any 289,541.21 · Cookware - Especially Plus 229,466.95 · Headphones - Spend 225,601.02 · Fragrances - Service Max 130,226.71",
    "text + table + bar chart",
  ],
  [
    "Monthly revenue trend for this year",
    "7 monthly points for 2026 — Jan 266,452.70 rising to a May peak of 439,292.18, then Jun 146,815.25 and a partial Jul 15,123.71",
    "text + table + line chart",
  ],
  [
    "Which category is most profitable?",
    "Home & Kitchen leads with 1,427,733.44 total profit; Electronics 269,198.08 is a distant second, Sports & Outdoors 131,766.20 last",
    "text + table + bar chart",
  ],
  [
    "How many customers do we have in each country?",
    "Canada 95 · USA 81 · Germany 77 · UK 75 · India 72",
    "text + table + bar chart",
  ],
  [
    "Average order value by customer segment",
    "Enterprise 1,484.85 · Small Business 1,442.01 · Consumer 1,426.92",
    "text + table + bar chart",
  ],
  [
    "What share of orders got cancelled?",
    "“The cancellation rate is 6.5%.”",
    "text (KPI)",
  ],
  [
    "Top 3 cities by number of orders in India",
    "Bengaluru 206 · Mumbai 195 · Kolkata 182",
    "text + table + bar chart",
  ],
  [
    "How much revenue did we lose to discounts this year?",
    "“Revenue lost to discounts is 81,103.17.”",
    "text (KPI)",
  ],
  [
    "Show me the best customers",
    "Deliberately ambiguous → asks ONE clarifying question (“by total revenue or by number of orders?”). Reply “number of orders” → Misty Hansen, Derrick Adams and Michele Lewis tie at 18 orders each",
    "clarification → answer",
  ],
  [
    "What will the weather be tomorrow?",
    "Out of scope → the exact message: “I am unable to understand the query. Please rephrase the query or ask another different query”",
    "fallback (verbatim)",
  ],
]

const TRACE_ROWS = [
  [
    "Natural-language query in, BI insight out",
    "Full pipeline; try any example query below",
  ],
  [
    "LLM generates accurate SQL (GenAI + RAG)",
    "SQL Generator grounded on schema + glossary + solved examples; SQL visible under every answer",
  ],
  [
    "Runs SQL on a sample database",
    "PostgreSQL ecommerce dataset: 400 customers · 90 products · 4,000 orders · 7,237 order items",
  ],
  [
    "Up to 3 clarifying questions",
    "Clarity checker with a per-question budget held in session state",
  ],
  [
    "Exact fallback message when clarity fails",
    "Returned verbatim as a code constant — character-exact",
  ],
  [
    "Format as text / chart / table (1, 2, or all 3)",
    "Formatter picks by result shape: KPI → text; ranked rows → text+table+chart; trends → line chart",
  ],
  [
    "Deployed with a public URL",
    "Permanent ngrok domain in front of the local three-service deployment",
  ],
]

function Section({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b pb-2 text-lg font-semibold tracking-tight">
        {n}. {title}
      </h2>
      {children}
    </section>
  )
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={
                    j === 0
                      ? "px-3 py-2 font-medium whitespace-nowrap"
                      : "px-3 py-2 text-muted-foreground"
                  }
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DesignPage() {
  return (
    <div className="h-dvh overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            <GradientText text="Design & Architecture" />
          </h1>
          <p className="text-sm text-muted-foreground">
            AI Assistant for Conversational Business Intelligence — natural
            language in, verified SQL-backed insight out.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <GithubMark className="size-4" />
                Source code on GitHub
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/">Open the assistant</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/data">Browse the dataset</Link>
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-md border bg-card p-3">
            <p className="text-xs font-medium">Tech stack — and why</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {STACK_BADGES.map(([tech, why]) => (
                <span key={tech} className="flex items-center gap-1.5 text-xs">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {tech}
                  </Badge>
                  <span className="text-muted-foreground">{why}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Full rationale per layer in section 9 below.
            </p>
          </div>
        </header>

        <Section n={1} title="What it does">
          <p className="text-sm leading-relaxed text-muted-foreground">
            A business user asks a question in plain English. The assistant
            decides whether the question is answerable; if a crucial detail is
            missing it asks up to <strong>three clarifying questions</strong>,
            and if clarity still isn&apos;t reached it replies with the exact
            message{" "}
            <em>
              &ldquo;I am unable to understand the query. Please rephrase the
              query or ask another different query&rdquo;
            </em>
            . For clear questions it generates one PostgreSQL SELECT grounded in
            the real schema (RAG), validates it, runs it read-only, and returns
            the result as a text summary, a table, and/or a chart — whichever
            fits the result&apos;s shape. It also holds a real conversation:
            follow-ups inherit context, and questions about the conversation
            itself are answered from memory without touching the database.
          </p>
          <DocTable
            headers={["Assignment requirement", "Where it is satisfied"]}
            rows={TRACE_ROWS}
          />
        </Section>

        <Section n={2} title="Service architecture — how the pieces talk">
          <MermaidDiagram chart={SERVICES_CHART} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Three deliberately separated services: the UI never talks to the
            database or the LLM; the Express backend owns state (sessions, chat
            history) and proxying; the Python service owns all AI logic. The LLM
            only ever <em>writes</em> SQL — it never executes anything.
          </p>
        </Section>

        <Section n={3} title="The 6-stage AI pipeline">
          <MermaidDiagram chart={PIPELINE_CHART} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            The cheapest component that can answer, answers: garbage input dies
            at the free regex guardrail; social messages and
            questions-about-the-conversation are answered without SQL; ambiguous
            questions cost one clarity call; only clear data questions pay for
            the full generate → validate → execute → format path (3 LLM calls).
            A failed validation or execution feeds the error back to the
            generator for exactly one self-repair attempt.
          </p>
        </Section>

        <Section n={4} title="Request sequence">
          <MermaidDiagram chart={SEQUENCE_CHART} />
        </Section>

        <Section n={5} title="Database — entity relationships">
          <MermaidDiagram chart={ER_CHART} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ecommerce dataset: 400 customers · 90 products · 4,000 orders ·
            7,237 order items, spanning three years (dates shifted at load time
            so &ldquo;last month&rdquo; questions return live data).{" "}
            <code className="rounded bg-muted px-1 text-xs">
              order_items.unit_price
            </code>{" "}
            is snapshotted at purchase time, and revenue is computed as{" "}
            <code className="rounded bg-muted px-1 text-xs">
              SUM(quantity × unit_price × (1 − discount_pct/100))
            </code>{" "}
            excluding Cancelled/Returned orders — a business rule the LLM learns
            from the glossary, not from guessing.
          </p>
        </Section>

        <Section n={6} title="Where RAG lives — and what augmentation means">
          <MermaidDiagram chart={RAG_CHART} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong>Retrieve:</strong> the semantic layer — the real schema, the
            business glossary (what &ldquo;revenue&rdquo; means, what
            &ldquo;last month&rdquo; means), and solved question→SQL pairs.{" "}
            <strong>Augment:</strong> that knowledge is pasted into the prompt
            above the question — the model&apos;s input is <em>augmented</em>{" "}
            with private facts it could never know from training.{" "}
            <strong>Generate:</strong> the model writes SQL from the facts in
            front of it — an open-book exam. Without the book, the model invents
            table names and dialects; with it, hallucination has nowhere to
            live. The knowledge base is small enough to retrieve in full on
            every call; when the schema grows to hundreds of tables, the same
            slot upgrades mechanically to pgvector similarity search.
          </p>
        </Section>

        <Section n={7} title="Safety — three independent write-defenses">
          <DocTable
            headers={["Layer", "What it guarantees"]}
            rows={SAFETY_ROWS}
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Any one layer alone stops a write; all three would have to fail
            simultaneously. The generated SQL is also always visible in the UI
            (&ldquo;View SQL&rdquo;) so every answer is auditable.
          </p>
        </Section>

        <Section n={8} title="Conversation memory">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every exchange is persisted by the backend and the{" "}
            <strong>full conversation transcript</strong> (questions, answer
            summaries, and the SQL used — capped at ~100k characters, well
            within the model&apos;s 200k-token context) rides along with every
            request. That is what makes follow-ups like &ldquo;and how does that
            compare to the month before?&rdquo; or &ldquo;which person are we
            talking about?&rdquo; work, and lets conversations be resumed from
            the sidebar days later.
          </p>
        </Section>

        <Section n={9} title="Technology choices">
          <DocTable headers={["Layer", "Choice", "Why"]} rows={TECH_ROWS} />
        </Section>

        <Section
          n={10}
          title="Try it — queries that work today, with expected output"
        >
          <p className="text-sm text-muted-foreground">
            Expected outputs are real results verified against the live database
            (as of July 2026 — the two date-relative queries move with the
            calendar).
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Ask this</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Expected output
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Response shape
                  </th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_QUERIES.map(([q, expected, shape], i) => (
                  <tr key={q} className="border-b align-top last:border-0">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="min-w-48 px-3 py-2 font-medium">{q}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {expected}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                      {shape}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-1">
            <Button size="sm" asChild>
              <Link href="/">Ask the assistant →</Link>
            </Button>
          </div>
        </Section>

        <footer className="border-t pt-4 pb-8 text-xs text-muted-foreground">
          Conversational BI Assistant — designed &amp; built by Sakshi Kumari.
          Frontend: Next.js 16 · Backend: Node.js Express · AI service: Python
          FastAPI · Database: PostgreSQL 18 · LLM: GLM-4.7 (Ollama Cloud).
        </footer>
      </div>
    </div>
  )
}
