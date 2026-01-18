
-- Create transactions table
CREATE TABLE IF NOT EXISTS t_wake_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES t_wake_products(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE t_wake_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read transactions"
ON t_wake_transactions FOR SELECT
USING (true);

CREATE POLICY "Public insert transactions"
ON t_wake_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update transactions"
ON t_wake_transactions FOR UPDATE
USING (true);

-- Indexes
CREATE INDEX idx_transactions_product_date ON t_wake_transactions(product_id, date);
CREATE INDEX idx_transactions_date ON t_wake_transactions(date);
