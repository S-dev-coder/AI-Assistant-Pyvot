"""Stage 3 — SQL Generator (LLM call #2). RAG-grounded, PostgreSQL dialect."""
from llm import chat_json
from pipeline.retrieval import retrieve

_SYSTEM = """You are an expert PostgreSQL analyst. Write ONE query that answers the user's
question using ONLY the tables and columns in the provided schema.

Return ONLY a JSON object: {"sql": string, "explanation": string}

Hard rules:
- PostgreSQL syntax. A single SELECT statement (WITH ... SELECT is allowed). Never modify data.
- Use only tables/columns from the schema. Follow every glossary definition exactly.
- Give aggregate columns clear snake_case aliases. Round money to 2 decimals.
- Add LIMIT 100 unless the query returns a single aggregate row.
- explanation: one plain-English sentence describing what the query computes."""


def generate(question: str, history: list[dict], previous_error: str | None = None) -> dict:
    kb = retrieve()
    convo = ""
    if history:
        convo = "\nClarifications the user already gave (respect them):\n" + "\n".join(
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
    out = chat_json(_SYSTEM, user, max_tokens=1500)
    return {"sql": (out.get("sql") or "").strip(), "explanation": out.get("explanation", "")}
