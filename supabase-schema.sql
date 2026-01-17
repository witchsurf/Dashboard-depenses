-- =============================================
-- SUPABASE SCHEMA FOR EXPENSE TRACKING
-- =============================================
-- Copy and paste this SQL in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_from_local BOOLEAN DEFAULT FALSE
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(date, category);

-- 3. Enable Row Level Security (optional but recommended)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow all operations (for simplicity)
-- In production, you'd want to restrict this to authenticated users
CREATE POLICY "Allow all operations" ON expenses
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Create view for daily summary
CREATE OR REPLACE VIEW daily_expenses AS
SELECT 
    date,
    SUM(amount) as total,
    COUNT(*) as count,
    ARRAY_AGG(DISTINCT category) as categories
FROM expenses
GROUP BY date
ORDER BY date DESC;

-- 6. Create view for category summary
CREATE OR REPLACE VIEW category_summary AS
SELECT 
    category,
    SUM(amount) as total,
    COUNT(*) as count,
    AVG(amount) as average,
    MIN(date) as first_expense,
    MAX(date) as last_expense
FROM expenses
GROUP BY category
ORDER BY total DESC;

-- 7. Create view for monthly summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(amount) as total,
    COUNT(*) as count,
    AVG(amount) as average
FROM expenses
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- 8. Function to get expenses by date range
CREATE OR REPLACE FUNCTION get_expenses_in_range(start_date DATE, end_date DATE)
RETURNS TABLE (
    id UUID,
    date DATE,
    amount DECIMAL,
    category VARCHAR,
    subcategory VARCHAR,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.date, e.amount, e.category, e.subcategory, e.description
    FROM expenses e
    WHERE e.date BETWEEN start_date AND end_date
    ORDER BY e.date DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SAMPLE DATA (optional - for testing)
-- =============================================
-- Uncomment to insert sample data

-- INSERT INTO expenses (date, amount, category, subcategory, description) VALUES
-- ('2024-01-15', 25000, 'ALIMENTATION', 'Courses', 'Supermarché'),
-- ('2024-01-15', 15000, 'TRANSPORT', 'Essence', 'Plein essence'),
-- ('2024-01-14', 5000, 'ALIMENTATION', 'Sorties', 'Restaurant'),
-- ('2024-01-13', 3500, 'SANTE', 'Médicaments', 'Pharmacie');
