# Business glossary — these definitions are POLICY. Follow them exactly.

- "revenue" / "sales" (money) =
  SUM(order_items.quantity * order_items.unit_price * (1 - order_items.discount_pct / 100.0))
  Use order_items.unit_price (price at purchase), never products.unit_price.
  Exclude orders with status IN ('Cancelled', 'Returned') unless the user explicitly asks for them.

- "cost" = SUM(order_items.quantity * products.unit_cost)  (join products for unit_cost)

- "profit" = revenue - cost, computed line by line:
  SUM(oi.quantity * (oi.unit_price * (1 - oi.discount_pct/100.0) - p.unit_cost))
  Same status exclusion as revenue.

- "units sold" / "quantity sold" = SUM(order_items.quantity), same status exclusion.

- "number of orders" / "order count" = COUNT(DISTINCT orders.order_id).
  Count ALL orders regardless of status unless the user asks otherwise — a cancelled
  order still happened as an order. (Status exclusions apply to money metrics, not counts.)

- "average order value" (AOV) = revenue / COUNT(DISTINCT order_id), over non-Cancelled/Returned orders.

- "cancellation rate" = orders with status 'Cancelled' * 100.0 / all orders.

- Time windows (order_date is a TIMESTAMP; today is CURRENT_DATE):
  - "last month" = the previous full calendar month:
    order_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
    AND order_date < date_trunc('month', CURRENT_DATE)
  - "this month" = order_date >= date_trunc('month', CURRENT_DATE)
  - "this year" = order_date >= date_trunc('year', CURRENT_DATE)
  - "last year" = the previous full calendar year.
  - "last N days" = order_date >= CURRENT_DATE - INTERVAL 'N days'

- "top N ..." → ORDER BY the metric DESC LIMIT N. If N is not given, use 5.

- "best selling" is by units sold unless the user says "by revenue".

- Status values are capitalized in the data: 'Completed', 'Cancelled', 'Returned', 'Pending'.
  Compare exactly (status = 'Completed'), never lowercase.

- Always give result columns clear snake_case aliases (e.g. AS total_revenue).

- Unless the user asks for a single total, add LIMIT 100 to protect the UI.
