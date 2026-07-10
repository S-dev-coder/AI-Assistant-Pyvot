"""Stage 2 — Clarity Checker / Clarifying-Intent Detector (LLM call #1)."""
from llm import chat_json
from pipeline.retrieval import retrieve

_SYSTEM = """You are the clarity checker of a Conversational BI assistant for an ecommerce database.
Decide whether the user's question can be turned into ONE correct SQL query against the schema below.

Return ONLY a JSON object:
{"verdict": "CLEAR" | "AMBIGUOUS" | "IMPOSSIBLE", "clarifying_question": string|null, "reason": string}

Rules:
- CLEAR: a competent analyst would write one obvious query. Minor defaults (top N=5,
  excluding cancelled orders) are covered by the glossary — do NOT ask about those.
- AMBIGUOUS: the question is about this data but a crucial choice is missing or the
  phrasing genuinely allows different queries with different answers. Ask ONE short,
  specific clarifying question a non-technical person can answer.
- IMPOSSIBLE: the question cannot be answered from this schema at all (weather, HR data,
  personal opinions, requests to modify data, etc.).
- Be permissive: prefer CLEAR when the glossary resolves the doubt. Only ask when truly needed.
"""


def check(question: str, history: list[dict]) -> dict:
    kb = retrieve()
    convo = ""
    if history:
        convo = "\nEarlier in this exchange:\n" + "\n".join(
            f"- Assistant asked: {h['q']}\n  User answered: {h['a']}" for h in history
        )
    user = (
        f"## Schema\n{kb['schema']}\n\n## Glossary (already-agreed defaults)\n{kb['glossary']}\n"
        f"{convo}\n\n## User question\n{question}"
    )
    out = chat_json(_SYSTEM, user)
    verdict = str(out.get("verdict", "")).upper()
    if verdict not in ("CLEAR", "AMBIGUOUS", "IMPOSSIBLE"):
        verdict = "AMBIGUOUS"
    return {
        "verdict": verdict,
        "clarifying_question": out.get("clarifying_question"),
        "reason": out.get("reason", ""),
    }
