import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

/**
 * GET /api/dashboard - Get all dashboard data from Supabase
 */
export async function GET(request: Request) {
    try {
        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

        // Get current month stats
        const now = new Date();
        const currentMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const nextMonth = now.getMonth() === 11 ?
            `${now.getFullYear() + 1}-01-01` :
            `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;

        // Fetch expenses for current month
        const { data: monthlyExpenses, error: expenseError } = await supabase
            .from('expenses')
            .select('amount, category, date')
            .gte('date', currentMonthStart)
            .lt('date', nextMonth);

        if (expenseError) throw expenseError;

        // Fetch income for current month
        const { data: monthlyIncome, error: incomeError } = await supabase
            .from('income')
            .select('amount, source, date')
            .gte('date', currentMonthStart)
            .lt('date', nextMonth);

        // Calculate KPIs
        const totalExpenses = monthlyExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
        const totalIncome = monthlyIncome?.reduce((sum, i) => sum + i.amount, 0) || 0;
        const netBalance = totalIncome - totalExpenses;

        // Group expenses by category
        const expensesByCategory: Record<string, number> = {};
        monthlyExpenses?.forEach(e => {
            expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
        });

        const categoryData = Object.entries(expensesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Get yearly data for time series
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;

        const { data: yearlyExpenses } = await supabase
            .from('expenses')
            .select('amount, date')
            .gte('date', yearStart)
            .lte('date', yearEnd);

        const { data: yearlyIncome } = await supabase
            .from('income')
            .select('amount, date')
            .gte('date', yearStart)
            .lte('date', yearEnd);

        // Group by month for time series
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const timeSeriesData = months.map((name, index) => {
            const monthExpenses = yearlyExpenses?.filter(e => new Date(e.date).getMonth() === index) || [];
            const monthIncome = yearlyIncome?.filter(i => new Date(i.date).getMonth() === index) || [];

            return {
                name,
                depenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
                revenus: monthIncome.reduce((sum, i) => sum + i.amount, 0),
            };
        });

        // Get recent transactions
        const { data: recentExpenses } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false })
            .limit(10);

        return NextResponse.json({
            success: true,
            kpis: [
                {
                    label: 'Dépenses du mois',
                    value: totalExpenses,
                    format: 'currency',
                    trend: 'stable',
                    color: '#EF4444',
                },
                {
                    label: 'Revenus du mois',
                    value: totalIncome,
                    format: 'currency',
                    trend: 'stable',
                    color: '#10B981',
                },
                {
                    label: 'Balance',
                    value: netBalance,
                    format: 'currency',
                    trend: netBalance >= 0 ? 'up' : 'down',
                    color: netBalance >= 0 ? '#10B981' : '#EF4444',
                },
                {
                    label: 'Transactions',
                    value: (monthlyExpenses?.length || 0) + (monthlyIncome?.length || 0),
                    format: 'number',
                    trend: 'stable',
                    color: '#8B5CF6',
                },
            ],
            categoryData,
            timeSeriesData,
            recentTransactions: recentExpenses || [],
            config: {
                mode: 'supabase',
                isConnected: true,
                statusMessage: 'Connecté à Supabase',
                lastUpdated: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
