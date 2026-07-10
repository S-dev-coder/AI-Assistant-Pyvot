"""Conversational BI — AI service orchestrator (FastAPI, port 8000).

Pipeline per request:
  guardrail → clarity (LLM #1) → generate (LLM #2) → validate → execute → format (LLM #3)
with one self-repair retry (validation or execution error fed back to the generator)
and a 3-clarifying-questions budget per user question.
"""
import logging

from fastapi import FastAPI
from pydantic import BaseModel

import sessions
from llm import LLMError
from pipeline import clarity, formatter, generator, guardrail
from pipeline.executor import ExecutionError, execute
from pipeline.validator import ValidationError, validate

log = logging.getLogger("uvicorn.error")

# The assignment requires this EXACT string after 3 failed clarifications.
FALLBACK_MESSAGE = (
    "I am unable to understand the query. "
    "Please rephrase the query or ask another different query"
)
MAX_CLARIFICATIONS = 3

app = FastAPI(title="Conversational BI — AI Service")


class AskRequest(BaseModel):
    session_id: str
    question: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask")
def ask(req: AskRequest):
    question = (req.question or "").strip()

    rejection = guardrail.check(question)
    if rejection:
        return {"type": "rejected", "message": rejection}

    state = sessions.get(req.session_id)

    # Is this message an answer to a clarifying question, or a new question?
    if state["pending_question"]:
        state["history"].append({"q": state["pending_question"], "a": question})
        state["pending_question"] = None
        effective_question = state["original_question"]
    else:
        sessions.reset_thread(state)
        state["original_question"] = question
        effective_question = question

    try:
        verdict = clarity.check(effective_question, state["history"])
    except LLMError as e:
        log.error("clarity LLM failure: %s", e)
        return {"type": "error", "message": "The language model is unreachable right now. Please try again."}

    if verdict["verdict"] == "IMPOSSIBLE":
        sessions.reset_thread(state)
        return {"type": "fallback", "message": FALLBACK_MESSAGE}

    if verdict["verdict"] == "AMBIGUOUS":
        if state["clarify_count"] >= MAX_CLARIFICATIONS:
            sessions.reset_thread(state)
            return {"type": "fallback", "message": FALLBACK_MESSAGE}
        state["clarify_count"] += 1
        cq = verdict["clarifying_question"] or "Could you rephrase your question with more detail?"
        state["pending_question"] = cq
        return {
            "type": "clarification",
            "question": cq,
            "remaining": MAX_CLARIFICATIONS - state["clarify_count"],
        }

    # CLEAR → generate with one self-repair retry across validate+execute
    error_feedback = None
    for attempt in (1, 2):
        try:
            gen = generator.generate(effective_question, state["history"], error_feedback)
            sql = validate(gen["sql"])
            result = execute(sql)
            break
        except (ValidationError, ExecutionError) as e:
            log.warning("attempt %d failed: %s", attempt, e)
            error_feedback = str(e)
            if attempt == 2:
                sessions.reset_thread(state)
                return {
                    "type": "error",
                    "message": "I could not build a reliable query for that question. Please try rewording it.",
                }
        except LLMError as e:
            log.error("generator LLM failure: %s", e)
            return {"type": "error", "message": "The language model is unreachable right now. Please try again."}

    shape = formatter.decide_shape(effective_question, result["columns"], result["rows"])
    summary = formatter.summarize(
        effective_question, sql, result["columns"], result["rows"], result["row_count"]
    )
    sessions.reset_thread(state)
    return {
        "type": "answer",
        "summary": summary,
        "sql": sql,
        "explanation": gen["explanation"],
        "columns": result["columns"],
        "rows": result["rows"],
        "chart": shape["chart"],
        "formats": shape["formats"],
    }
