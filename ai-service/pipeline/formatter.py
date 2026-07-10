"""Stage 6 — Response Formatter. The response SHAPE (text/table/chart) is decided
by code from the result shape; the LLM (call #3) only writes a summary that
rephrases rows it is shown — it never computes numbers."""
import re

from llm import LLMError, chat_json

_SYSTEM = """You are a BI analyst writing the one-line takeaway of a query result.
Return ONLY a JSON object: {"summary": string}
Rules:
- 1-2 short sentences, plain business English.
- Use ONLY numbers, names and values that literally appear in the rows shown. Never
  compute, extrapolate, or invent anything. If rows are empty, say no data matched.
- Format large money values readably (e.g. 1,234,567.89)."""

_DATEISH = re.compile(r"^\d{4}(-\d{2}){1,2}")
_SHARE_HINT = re.compile(r"\b(share|split|distribution|breakdown|proportion|percentage of)\b", re.I)


def _is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def decide_shape(question: str, columns: list, rows: list) -> dict:
    """Pure-code decision: which of text/table/chart, and which chart kind."""
    if not rows:
        return {"formats": ["text"], "chart": None}
    if len(rows) == 1 and len(columns) == 1:
        return {"formats": ["text"], "chart": None}

    chart = None
    if len(columns) >= 2 and len(rows) >= 2:
        # label column + first numeric column → chartable
        first = [r[0] for r in rows]
        num_idx = next((i for i in range(1, len(columns)) if all(_is_num(r[i]) for r in rows)), None)
        if num_idx is not None and all(isinstance(v, str) for v in first):
            if all(_DATEISH.match(v) for v in first):
                kind = "line"
            elif _SHARE_HINT.search(question) and len(rows) <= 8:
                kind = "pie"
            else:
                kind = "bar"
            chart = {"kind": kind, "x": columns[0], "y": columns[num_idx]}

    formats = ["text", "table"] + (["chart"] if chart else [])
    return {"formats": formats, "chart": chart}


def summarize(question: str, sql: str, columns: list, rows: list, row_count: int) -> str:
    shown = rows[:20]
    user = (
        f"Question: {question}\n"
        f"Result columns: {columns}\n"
        f"Result rows shown ({len(shown)} of {row_count}):\n{shown}"
    )
    try:
        out = chat_json(_SYSTEM, user, max_tokens=2048)
        summary = str(out.get("summary", "")).strip()
        if summary:
            return summary
    except LLMError:
        pass
    # deterministic fallback so an LLM hiccup never blocks a valid result
    if not rows:
        return "No data matched your question."
    if len(rows) == 1 and len(columns) == 1:
        return f"{columns[0]}: {rows[0][0]}"
    return f"Returned {row_count} rows — see the table below."
