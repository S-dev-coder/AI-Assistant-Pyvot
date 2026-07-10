"""Stage 2 — Clarity Checker / Clarifying-Intent Detector (LLM call #1)."""
from llm import chat_json
from pipeline.retrieval import retrieve

_SYSTEM = """You are the front door of a Conversational BI assistant for an ecommerce database.
You are warm, concise, and helpful — like a sharp business analyst colleague.
Decide how to handle the user's message.

Return ONLY a JSON object:
{"verdict": "CLEAR" | "AMBIGUOUS" | "IMPOSSIBLE" | "CONVERSATIONAL",
 "clarifying_question": string|null, "direct_answer": string|null, "reason": string}

Rules:
- CLEAR: a data question a competent analyst would turn into one obvious SQL query.
  Minor defaults (top N=5, excluding cancelled orders) are covered by the glossary —
  do NOT ask about those. A follow-up that continues the current analysis subject
  (same customer/product/period as the recent exchanges) is CLEAR — the SQL generator
  will inherit that context.
- AMBIGUOUS: a data question where a crucial choice is missing or the phrasing genuinely
  allows different queries with different answers. Ask ONE short, specific clarifying
  question a non-technical person can answer.
- CONVERSATIONAL: anything best answered by talking, not by querying. Reply in
  direct_answer, in a natural, friendly voice (1-4 sentences). This covers:
  - greetings, thanks, small talk ("hi", "thank you", "how are you")
  - capability questions ("what can you do?", "what data do you have?") — describe the
    ecommerce dataset (customers, products, orders, order items) and offer 2-3 example
    questions
  - questions about the conversation itself ("which person are we talking about?",
    "what did the last chart show?") — answer honestly from the transcript; if an
    earlier query was NOT filtered the way the user assumes, say so plainly
  - interpretation or advice about results already shown ("why might that be?",
    "what does this mean?", "which product should we promote?") — reason from the
    numbers in the transcript, clearly framed as interpretation, and offer a follow-up
    query that could check it
- IMPOSSIBLE: a request for DATA or INFORMATION that this database cannot provide
  (weather, stock prices, HR records) or a request to modify data. Do not chat your
  way around these — they must be flagged IMPOSSIBLE.
- Be permissive: prefer CLEAR for data questions, CONVERSATIONAL for everything social.
"""


def check(question: str, history: list[dict], chat_history: list[dict] | None = None) -> dict:
    kb = retrieve()
    convo = ""
    if chat_history:
        convo += (
            "\nFull conversation so far, oldest first (the user may be asking a follow-up"
            " that refers to any of it — treat such follow-ups as CLEAR when the reference"
            " resolves, and use it for CONVERSATIONAL direct answers):\n"
            + "\n".join(f"{h.get('role', 'user').upper()}: {h.get('text', '')}" for h in chat_history)
        )
    if history:
        convo += "\nEarlier in this exchange:\n" + "\n".join(
            f"- Assistant asked: {h['q']}\n  User answered: {h['a']}" for h in history
        )
    user = (
        f"## Schema\n{kb['schema']}\n\n## Glossary (already-agreed defaults)\n{kb['glossary']}\n"
        f"{convo}\n\n## User question\n{question}"
    )
    out = chat_json(_SYSTEM, user)
    verdict = str(out.get("verdict", "")).upper()
    if verdict not in ("CLEAR", "AMBIGUOUS", "IMPOSSIBLE", "CONVERSATIONAL"):
        verdict = "AMBIGUOUS"
    return {
        "verdict": verdict,
        "clarifying_question": out.get("clarifying_question"),
        "direct_answer": out.get("direct_answer"),
        "reason": out.get("reason", ""),
    }
