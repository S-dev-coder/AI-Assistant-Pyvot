# Database: ecommerce_bi (PostgreSQL)

Synthetic e-commerce dataset. Order data spans 2023-06-19 to 2026-07-08.
Dialect: PostgreSQL. Always write PostgreSQL syntax.

## Table: customers (400 rows)
- customer_id   INTEGER PRIMARY KEY
- name          VARCHAR — customer full name
- email         VARCHAR UNIQUE
- city          VARCHAR — e.g. 'New York', 'Austin'
- country       VARCHAR — exactly one of: 'USA', 'UK', 'India', 'Germany', 'Canada'
- segment       VARCHAR — exactly one of: 'Consumer', 'Small Business', 'Enterprise'
- signup_date   DATE

## Table: products (90 rows)
- product_id    INTEGER PRIMARY KEY
- product_name  VARCHAR
- category      VARCHAR — exactly one of: 'Electronics', 'Apparel', 'Home & Kitchen',
                'Books & Media', 'Beauty & Personal Care', 'Sports & Outdoors'
- subcategory   VARCHAR
- unit_cost     NUMERIC(10,2) — what the business pays per unit
- unit_price    NUMERIC(10,2) — current catalog selling price

## Table: orders (4,000 rows)
- order_id        INTEGER PRIMARY KEY
- customer_id     INTEGER NOT NULL REFERENCES customers(customer_id)
- order_date      TIMESTAMP
- status          VARCHAR — exactly one of: 'Completed', 'Cancelled', 'Returned', 'Pending'
                  (values are capitalized — match them exactly)
- payment_method  VARCHAR — one of: 'Credit Card', 'Debit Card', 'UPI', 'PayPal',
                  'Net Banking', 'Cash on Delivery'

## Table: order_items (7,237 rows)
- order_item_id  INTEGER PRIMARY KEY
- order_id       INTEGER NOT NULL REFERENCES orders(order_id)
- product_id     INTEGER NOT NULL REFERENCES products(product_id)
- quantity       INTEGER
- unit_price     NUMERIC(10,2) — price AT TIME OF PURCHASE (use this for revenue, not products.unit_price)
- discount_pct   NUMERIC(5,2) — percentage discount applied to this line (0 means no discount)

## Join paths
- orders.customer_id → customers.customer_id
- order_items.order_id → orders.order_id
- order_items.product_id → products.product_id
- customers ↔ products only connect THROUGH orders + order_items.
