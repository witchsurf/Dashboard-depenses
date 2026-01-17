-- =============================================
-- SUPABASE FULL MIGRATION SCHEMA
-- =============================================
-- Exécutez ce SQL dans Supabase SQL Editor

-- 1. Table des revenus
CREATE TABLE IF NOT EXISTS income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    source VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des catégories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL DEFAULT 'expense', -- 'expense' ou 'income'
    icon VARCHAR(10),
    color VARCHAR(20),
    budget_limit DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(date_trunc('month', date));
CREATE INDEX IF NOT EXISTS idx_income_month ON income(date_trunc('month', date));

-- 4. Enable RLS
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Policies (accès public pour simplifier)
CREATE POLICY "Allow all on income" ON income FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 6. Insérer les catégories prédéfinies
INSERT INTO categories (name, type, icon, color) VALUES
    ('MAISON', 'expense', '🏠', '#8B5CF6'),
    ('ALIMENTATION', 'expense', '🍽️', '#06B6D4'),
    ('TRANSPORT', 'expense', '🚗', '#F59E0B'),
    ('SANTE', 'expense', '💊', '#EF4444'),
    ('EDUCATION', 'expense', '📚', '#10B981'),
    ('LOISIRS', 'expense', '🎮', '#EC4899'),
    ('VETEMENTS', 'expense', '👕', '#3B82F6'),
    ('ENFANTS', 'expense', '👶', '#84CC16'),
    ('AUTRES', 'expense', '📦', '#6B7280'),
    ('Salaire', 'income', '💰', '#10B981'),
    ('Freelance', 'income', '💻', '#06B6D4'),
    ('Investissements', 'income', '📈', '#8B5CF6'),
    ('Autres revenus', 'income', '💵', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- 7. Vue pour les KPIs du mois courant
CREATE OR REPLACE VIEW monthly_kpis AS
SELECT 
    DATE_TRUNC('month', CURRENT_DATE) as month,
    COALESCE((SELECT SUM(amount) FROM income WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as total_income,
    COALESCE((SELECT SUM(amount) FROM expenses WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as total_expenses,
    COALESCE((SELECT SUM(amount) FROM income WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) -
    COALESCE((SELECT SUM(amount) FROM expenses WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)), 0) as net_balance;

-- 8. Vue pour les dépenses par catégorie
CREATE OR REPLACE VIEW expenses_by_category AS
SELECT 
    category,
    SUM(amount) as total,
    COUNT(*) as count,
    DATE_TRUNC('month', date) as month
FROM expenses
GROUP BY category, DATE_TRUNC('month', date)
ORDER BY total DESC;

-- 9. Vue pour l'évolution mensuelle
CREATE OR REPLACE VIEW monthly_evolution AS
SELECT 
    DATE_TRUNC('month', date) as month,
    'expense' as type,
    SUM(amount) as amount
FROM expenses
GROUP BY DATE_TRUNC('month', date)
UNION ALL
SELECT 
    DATE_TRUNC('month', date) as month,
    'income' as type,
    SUM(amount) as amount
FROM income
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;

-- 10. Fonction pour récupérer les stats du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalIncome', COALESCE((SELECT SUM(amount) FROM income WHERE EXTRACT(YEAR FROM date) = p_year), 0),
        'totalExpenses', COALESCE((SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM date) = p_year), 0),
        'netBalance', COALESCE((SELECT SUM(amount) FROM income WHERE EXTRACT(YEAR FROM date) = p_year), 0) - 
                      COALESCE((SELECT SUM(amount) FROM expenses WHERE EXTRACT(YEAR FROM date) = p_year), 0),
        'expenseCount', (SELECT COUNT(*) FROM expenses WHERE EXTRACT(YEAR FROM date) = p_year),
        'incomeCount', (SELECT COUNT(*) FROM income WHERE EXTRACT(YEAR FROM date) = p_year)
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
