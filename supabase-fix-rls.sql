
-- Enable RLS for Products
ALTER TABLE t_wake_products ENABLE ROW LEVEL SECURITY;

-- Policies for t_wake_products
CREATE POLICY "Public read products"
ON t_wake_products FOR SELECT
USING (true);

CREATE POLICY "Public insert products"
ON t_wake_products FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update products"
ON t_wake_products FOR UPDATE
USING (true);

-- Just in case, enable for sales too if missing
ALTER TABLE t_wake_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sales"
ON t_wake_sales FOR SELECT
USING (true);

CREATE POLICY "Public insert sales"
ON t_wake_sales FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update sales"
ON t_wake_sales FOR UPDATE
USING (true);
