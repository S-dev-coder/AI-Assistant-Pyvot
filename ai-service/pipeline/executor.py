"""Stage 5 — Query Executor. Runs validated SQL on PostgreSQL as bi_readonly.
Write-defense layers 2 and 3 live here: the role has SELECT-only grants with
default_transaction_read_only=on and statement_timeout=10s, and the connection
itself is opened read-only."""
import datetime
import os
from decimal import Decimal

import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bi_readonly:bi_readonly_local@localhost:5432/ecommerce_bi",
)
MAX_ROWS = 500


class ExecutionError(Exception):
    pass


def _jsonable(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat(sep=" ") if isinstance(v, datetime.datetime) else v.isoformat()
    return v


def execute(sql: str) -> dict:
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=5) as conn:
            conn.read_only = True
            with conn.cursor() as cur:
                cur.execute(sql)
                columns = [d.name for d in cur.description or []]
                rows = [[_jsonable(v) for v in r] for r in cur.fetchmany(MAX_ROWS)]
        return {"columns": columns, "rows": rows, "row_count": len(rows)}
    except psycopg.Error as e:
        raise ExecutionError(str(e).strip().split("\n")[0]) from e
