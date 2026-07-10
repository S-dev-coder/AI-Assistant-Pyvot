"""Stage 1 — cheap regex/length checks. No LLM call, zero cost on garbage input."""
import re

MAX_LEN = 500

_GREETING = re.compile(r"^\s*(hi|hello|hey|yo|good (morning|afternoon|evening)|thanks?|thank you)\s*[!.]*\s*$", re.I)


def check(question: str) -> str | None:
    """Return a rejection message, or None if the input may proceed."""
    q = (question or "").strip()
    if not q:
        return "Please type a question about the ecommerce data."
    if len(q) > MAX_LEN:
        return f"That question is too long ({len(q)} chars, max {MAX_LEN}). Please ask something shorter."
    if _GREETING.match(q):
        return "Hi! Ask me a question about the ecommerce data — e.g. \"What was our total revenue last month?\""
    if not re.search(r"[A-Za-z]", q):
        return "I couldn't find a question in that. Please ask about the ecommerce data in plain English."
    return None
