"""Stage 4 — SQL Validator. sqlglot AST checks: single SELECT-only statement,
known tables/columns, hard LIMIT cap. First of three independent write-defenses
(the others: bi_readonly role grants, read-only transactions)."""
import sqlglot
from sqlglot import exp

SCHEMA = {
    "customers": {"customer_id", "name", "email", "city", "country", "segment", "signup_date"},
    "products": {"product_id", "product_name", "category", "subcategory", "unit_cost", "unit_price"},
    "orders": {"order_id", "customer_id", "order_date", "status", "payment_method"},
    "order_items": {"order_item_id", "order_id", "product_id", "quantity", "unit_price", "discount_pct"},
}
ALL_COLUMNS = set().union(*SCHEMA.values())
HARD_LIMIT = 500

_FORBIDDEN = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create, exp.Alter,
    exp.Grant, exp.TruncateTable, exp.Command, exp.Merge, exp.Set,
)


class ValidationError(Exception):
    pass


def validate(sql: str) -> str:
    """Return normalized, LIMIT-capped SQL or raise ValidationError."""
    if not sql:
        raise ValidationError("empty SQL")

    try:
        statements = sqlglot.parse(sql, read="postgres")
    except sqlglot.errors.ParseError as e:
        raise ValidationError(f"SQL does not parse as PostgreSQL: {e}") from e

    statements = [s for s in statements if s is not None]
    if len(statements) != 1:
        raise ValidationError(f"expected exactly 1 statement, got {len(statements)}")
    tree = statements[0]

    if not isinstance(tree, (exp.Select, exp.Union)):
        raise ValidationError(f"only SELECT queries are allowed, got {type(tree).__name__}")

    for node in tree.walk():
        if isinstance(node, _FORBIDDEN):
            raise ValidationError(f"forbidden operation: {type(node).__name__}")

    cte_names = {c.alias_or_name.lower() for c in tree.find_all(exp.CTE)}
    for table in tree.find_all(exp.Table):
        name = table.name.lower()
        if name not in SCHEMA and name not in cte_names:
            raise ValidationError(f"unknown table: {table.name}")

    # column names must exist somewhere in the schema, unless they are aliases
    # defined inside the query itself (SELECT ... AS x, CTE output columns)
    alias_names = {a.alias.lower() for a in tree.find_all(exp.Alias) if a.alias}
    for col in tree.find_all(exp.Column):
        name = col.name.lower()
        if name == "*":
            continue
        if name not in ALL_COLUMNS and name not in alias_names:
            raise ValidationError(f"unknown column: {col.name}")

    # cap the result size no matter what the LLM wrote
    if isinstance(tree, exp.Select) and tree.args.get("limit") is None:
        tree = tree.limit(HARD_LIMIT)

    return tree.sql(dialect="postgres")
