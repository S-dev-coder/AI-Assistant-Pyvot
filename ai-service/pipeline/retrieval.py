"""RAG retrieval step. The knowledge base (semantic_layer/) is small enough to
retrieve in full every call; swap this module for a pgvector similarity search
when the schema outgrows a single prompt."""
import json
from pathlib import Path

_LAYER = Path(__file__).resolve().parent.parent / "semantic_layer"


def retrieve() -> dict:
    examples = json.loads((_LAYER / "examples.json").read_text())
    shots = "\n\n".join(f"Q: {e['question']}\nSQL: {e['sql']}" for e in examples)
    return {
        "schema": (_LAYER / "schema.md").read_text(),
        "glossary": (_LAYER / "glossary.md").read_text(),
        "examples": shots,
    }
