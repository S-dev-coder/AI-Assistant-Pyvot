"""OpenAI-compatible LLM client. Provider is swappable via env (MiniMax default)."""
import json
import os
import re

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

BASE_URL = os.getenv("LLM_BASE_URL", "https://api.minimax.io/v1")
MODEL = os.getenv("LLM_MODEL", "MiniMax-M2")
API_KEY = os.getenv("LLM_API_KEY") or os.getenv("MINIMAX_API_KEY") or ""

_client = OpenAI(base_url=BASE_URL, api_key=API_KEY)


class LLMError(Exception):
    pass


def chat_json(system: str, user: str, max_tokens: int = 1024) -> dict:
    """One LLM call that must return a JSON object. Tolerant of markdown fences
    and prose around the JSON; retries once on unparseable output."""
    last_err = None
    for attempt in range(2):
        try:
            resp = _client.chat.completions.create(
                model=MODEL,
                temperature=0,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            text = resp.choices[0].message.content or ""
            return _extract_json(text)
        except LLMError as e:
            last_err = e
        except Exception as e:  # network/provider errors
            last_err = e
    raise LLMError(f"LLM call failed: {last_err}")


def _extract_json(text: str) -> dict:
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S)  # reasoning models
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.S)
    candidates = [fence.group(1)] if fence else []
    brace = re.search(r"\{.*\}", text, flags=re.S)
    if brace:
        candidates.append(brace.group(0))
    for c in candidates:
        try:
            obj = json.loads(c)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue
    raise LLMError(f"no JSON object in LLM output: {text[:200]!r}")
