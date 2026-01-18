import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
        auth: {
            persistSession: false,
        },
        global: {
            headers: { 'Cache-Control': 'no-store' },
            fetch: (url, options) => {
                return fetch(url, {
                    ...options,
                    cache: 'no-store',
                    next: { revalidate: 0 },
                });
            },
        },
    });
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

        // V2 - Use same query as debug endpoint which works
        const monthStart = '2026-01-01';
        const monthEnd = '2026-02-01';

        console.log('Dashboard API V2 - Date filter:', { monthStart, monthEnd });

        // Fetch expenses for January 2026 - same as debug endpoint
        const { data: monthlyExpenses, error: expenseError } = await supabase
            .from('expenses')
            .select('id, date, amount, category, created_at')
            .gte('date', monthStart)
            .lt('date', monthEnd);

        if (expenseError) {
            console.error('Expense query error:', expenseError);
            return NextResponse.json({
                success: false,
                error: expenseError.message,
                version: 'v2'
            }, { status: 500 });
        }

        console.log('Monthly expenses found:', monthlyExpenses?.length, 'First:', monthlyExpenses?.[0]);

        // Fetch income for current month - same style as expenses query
        const { data: monthlyIncome, error: incomeError } = await supabase
            .from('income')
            .select('id, date, amount, source')
            .gte('date', '2026-01-01')
            .lt('date', '2026-02-01');

        if (incomeError) {
            console.error('Income query error:', incomeError);
        }

        // --- NEW: Calculate T-WAKE Profit for Current Month ---
        let tWakeProfit = 0;
        let tWakeTxs: any[] | null = [];
        try {
            const result = await supabase
                .from('t_wake_transactions')
                .select(`
                    quantity,
                    product:t_wake_products (selling_price, unit_cost)
                `)
                .gte('date', '2026-01-01')
                .lt('date', '2026-02-01');

            tWakeTxs = result.data;
            const tWakeError = result.error;

            if (!tWakeError && tWakeTxs) {
                tWakeProfit = tWakeTxs.reduce((sum, t: any) => {
                    if (!t.product) return sum;
                    const margin = t.product.selling_price - t.product.unit_cost;
                    return sum + (Number(t.quantity) * margin);
                }, 0);
                console.log('T-WAKE Profit added to Revenue:', tWakeProfit);
            }
        } catch (twError) {
            console.error('Failed to fetch T-WAKE stats for dashboard', twError);
        }
        // -----------------------------------------------------

        console.log('Monthly income found:', monthlyIncome?.length);

        // Calculate KPIs
        const totalExpenses = monthlyExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        // Filter out existing static T-WAKE entries to avoid double counting
        // Known duplicat source: 'T-wake/LP'
        const baseIncome = monthlyIncome?.reduce((sum, i) => {
            if (i.source === 'T-wake/LP') return sum; // Skip static import
            return sum + Number(i.amount);
        }, 0) || 0;

        const totalIncome = baseIncome + tWakeProfit; // Add dynamic T-WAKE profit
        const netBalance = totalIncome - totalExpenses;

        // Debug - count items
        const expenseCount = monthlyExpenses?.length || 0;
        const incomeCount = monthlyIncome?.reduce((count, i) => {
            if (i.source === 'T-wake/LP') return count;
            return count + 1;
        }, 0) || 0;

        // Group expenses by category
        const expensesByCategory: Record<string, number> = {};
        monthlyExpenses?.forEach(e => {
            expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
        });

        const categoryData = Object.entries(expensesByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Get yearly data for time series
        const yearStart = '2026-01-01';
        const yearEnd = '2026-12-31';

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
        // For January (current month), use same data as KPIs to ensure consistency
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const timeSeriesData = months.map((name, index) => {
            if (index === 0) {
                // January - use the same data as KPIs
                return {
                    name,
                    depenses: totalExpenses,
                    revenus: totalIncome, // Includes T-WAKE
                };
            }

            // Other months - from yearly queries (will be 0 for now)
            const monthExpenses = yearlyExpenses?.filter(e => new Date(e.date).getMonth() === index) || [];
            const monthIncomeData = yearlyIncome?.filter(i => new Date(i.date).getMonth() === index) || [];

            return {
                name,
                depenses: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
                revenus: monthIncomeData.reduce((sum, i) => sum + Number(i.amount), 0),
            };
        });

        // Get recent transactions (Expenses + Income)
        // Fetch more items (50) to ensure we get a good mix if one category has many recent entries
        const { data: recentExpenses } = await supabase
            .from('expenses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        const { data: recentIncome } = await supabase
            .from('income')
            .select('*')
            .neq('source', 'T-wake/LP') // Exclude legacy static entry to avoid duplication in list
            .order('created_at', { ascending: false })
            .limit(50);

        // Fetch recent T-WAKE sales for transaction list
        const { data: recentTWake } = await supabase
            .from('t_wake_transactions')
            .select(`
                *,
                product:t_wake_products (name, selling_price, unit_cost)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        // Merge and Sort
        const mixedTransactions = [
            ...(recentExpenses?.map(e => ({ ...e, type: 'expense' })) || []),
            ...(recentIncome?.map(i => ({
                ...i,
                type: 'income',
                category: i.source // Map source to category
            })) || []),
            ...(recentTWake?.map((t: any) => {
                // Calculate margin for "Amount" to match revenue logic
                const margin = t.product ? (t.product.selling_price - t.product.unit_cost) * t.quantity : 0;
                return {
                    id: t.id,
                    date: t.date,
                    amount: margin,
                    category: 'Vente T-WAKE',
                    description: `${t.product?.name || 'Produit'} (x${t.quantity})`,
                    created_at: t.created_at,
                    type: 'income'
                };
            }) || [])
        ].sort((a, b) => {
            // Sort by date (business date) first
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;
            // Then by creation time (newest created first)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
            .slice(0, 10);



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
                    value: (monthlyExpenses?.length || 0) + (monthlyIncome?.length || 0) + (tWakeTxs?.filter((t: any) => {
                        const dateStr = String(t.date || '');
                        const descStr = String(t.description || '');
                        // Filter out if date is Jan 1st OR description contains 'Import'
                        if (dateStr.includes('2026-01-01')) return false;
                        if (descStr.includes('Import')) return false;
                        return true;
                    }).length || 0),
                    format: 'number',
                    trend: 'stable',
                    color: '#8B5CF6',
                },
            ],
            categoryData,
            timeSeriesData,
            recentTransactions: mixedTransactions,
            config: {
                mode: 'supabase',
                isConnected: true,
                statusMessage: 'Connecté à Supabase',
                lastUpdated: new Date().toISOString(),
                debug: {
                    expenseCount,
                    incomeCount,
                    tWakeTotal: tWakeTxs?.length || 0,
                    // Show dates of first 5 items to debug format if needed
                    tWakeDates: tWakeTxs?.slice(0, 5).map((t: any) => t.date),
                    monthStart,
                    monthEnd,
                    monthlyExpenseIds: monthlyExpenses?.map(e => e.id) || []
                }
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
