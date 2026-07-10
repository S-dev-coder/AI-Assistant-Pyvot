"""In-memory per-session clarification state. A 'thread' is one user question plus
its clarification exchange; answering or giving up (fallback) closes the thread."""
import threading
import time

_TTL_SECONDS = 60 * 60
_lock = threading.Lock()
_sessions: dict[str, dict] = {}


def _fresh() -> dict:
    return {
        "original_question": None,   # the question being clarified
        "pending_question": None,    # clarifying question we asked, awaiting answer
        "clarify_count": 0,          # clarifying questions asked in this thread (max 3)
        "history": [],               # [{"q": asked, "a": answered}, ...]
        "touched": time.time(),
    }


def get(session_id: str) -> dict:
    with _lock:
        now = time.time()
        for sid in [s for s, v in _sessions.items() if now - v["touched"] > _TTL_SECONDS]:
            del _sessions[sid]
        state = _sessions.setdefault(session_id, _fresh())
        state["touched"] = now
        return state


def reset_thread(state: dict) -> None:
    state["original_question"] = None
    state["pending_question"] = None
    state["clarify_count"] = 0
    state["history"] = []
