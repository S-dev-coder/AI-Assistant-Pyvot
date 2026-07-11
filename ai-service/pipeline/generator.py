"""Stage 3 — SQL Generator (LLM call #2). RAG-grounded, PostgreSQL dialect."""
from llm import chat_json
from pipeline.retrieval import retrieve

_SYSTEM = """You are an expert PostgreSQL analyst. Write ONE query that answers the user's
question using ONLY the tables and columns in the provided schema.

Return ONLY a JSON object: {"sql": string, "explanation": string}

Hard rules:
- PostgreSQL syntax. A single SELECT statement (WITH ... SELECT is allowed). Never modify data.
- CONTEXT CARRY-OVER: if the question continues an ongoing analysis (see the recent
  conversation), keep the subject and filters of the most recent relevant query — the
  specific customer, product, category, or period being discussed — unless the user
  explicitly changes or broadens the scope. Example: after questions about one customer,
  "graph of items vs date purchased" means THAT customer's items, not everyone's.
- OPTION ECHO: if the user's message merely echoes an option offered in a recent
  clarifying question, they are re-asking the SAME underlying question with that
  option — never a literal standalone question. Example: assistant asked "rank best
  customers by total revenue or by number of orders?", user chose "total revenue" and
  got the answer, then says "total number of orders?" → they want the best customers
  ranked by order count, NOT a global count of orders.
- Use only tables/columns from the schema. Follow every glossary definition exactly.
- Give aggregate columns clear snake_case aliases. Round money to 2 decimals.
- Add LIMIT 100 unless the query returns a single aggregate row.
- explanation: one plain-English sentence describing what the query computes."""


def generate(
    question: str,
    history: list[dict],
    previous_error: str | None = None,
    chat_history: list[dict] | None = None,
) -> dict:
    kb = retrieve()
    convo = ""
    if chat_history:
        convo += (
            "\nFull conversation so far, oldest first (if the user's question is a follow-up"
            " like 'and for last year?' or 'same by country', adapt the matching earlier SQL"
            " and keep the subject being discussed):\n"
            + "\n".join(f"{h.get('role', 'user').upper()}: {h.get('text', '')}" for h in chat_history)
        )
    if history:
        convo += "\nClarifications the user already gave (respect them):\n" + "\n".join(
            f"- Q: {h['q']}\n  A: {h['a']}" for h in history
        )
    repair = ""
    if previous_error:
        repair = (
            "\nYour previous attempt failed. Fix it.\n"
            f"Error: {previous_error}\nReturn a corrected query."
        )
    user = (
        f"## Schema\n{kb['schema']}\n\n## Glossary\n{kb['glossary']}\n\n"
        f"## Solved examples\n{kb['examples']}\n{convo}{repair}\n\n"
        f"## User question\n{question}"
    )
    out = chat_json(_SYSTEM, user, max_tokens=6144)
    return {"sql": (out.get("sql") or "").strip(), "explanation": out.get("explanation", "")}
