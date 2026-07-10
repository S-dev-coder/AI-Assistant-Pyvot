#!/usr/bin/env bash
# One-time database setup: load the ecommerce dump into local PostgreSQL,
# shift dates to the current timeline, create the read-only role.
set -euo pipefail

DUMP="${1:?usage: setup_db.sh path/to/ecommerce_dataset_postgres.sql}"

psql -d postgres -c "DROP DATABASE IF EXISTS ecommerce_bi;" -c "CREATE DATABASE ecommerce_bi;"
psql -q -d ecommerce_bi -f "$DUMP"

# shift all dates forward so the newest order lands 2 days ago (demo-friendly
# "last month" / "this year" windows), preserving every relative interval
psql -d ecommerce_bi <<'SQL'
DO $$
DECLARE shift_days int;
BEGIN
  SELECT ((CURRENT_DATE - 2) - MAX(order_date)::date) INTO shift_days FROM orders;
  UPDATE orders SET order_date = order_date + make_interval(days => shift_days);
  UPDATE customers SET signup_date = signup_date + make_interval(days => shift_days);
  RAISE NOTICE 'dates shifted by % days', shift_days;
END $$;

DROP ROLE IF EXISTS bi_readonly;
CREATE ROLE bi_readonly LOGIN PASSWORD 'bi_readonly_local';
GRANT CONNECT ON DATABASE ecommerce_bi TO bi_readonly;
GRANT USAGE ON SCHEMA public TO bi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly;
ALTER ROLE bi_readonly SET default_transaction_read_only = on;
ALTER ROLE bi_readonly SET statement_timeout = '10s';
SQL

psql -d ecommerce_bi -c "SELECT 'customers' t, count(*) FROM customers UNION ALL SELECT 'orders', count(*) FROM orders;"
echo "done — connection string: postgresql://bi_readonly:bi_readonly_local@localhost:5432/ecommerce_bi"
