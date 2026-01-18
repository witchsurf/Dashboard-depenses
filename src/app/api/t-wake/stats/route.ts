
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function GET() {
    try {
        const supabase = getSupabaseClient();

        // Fetch revenue/profit stats
        // We need transactions joined with products
        const { data, error } = await supabase
            .from('t_wake_transactions')
            .select(`
                quantity,
                date,
                product:t_wake_products (
                    selling_price,
                    unit_cost
                )
            `);

        if (error) throw error;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];

        // Start of Week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const startOfWeek = new Date(now.setDate(diff)).toISOString().split('T')[0];
        // Reset now
        const now2 = new Date();

        const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString().split('T')[0];
        const startOfYear = new Date(now2.getFullYear(), 0, 1).toISOString().split('T')[0];

        const stats = {
            today: { revenue: 0, profit: 0, count: 0 },
            week: { revenue: 0, profit: 0, count: 0 },
            month: { revenue: 0, profit: 0, count: 0 },
            year: { revenue: 0, profit: 0, count: 0 }
        };

        data?.forEach((t: any) => {
            if (!t.product) return;

            const date = t.date; // YYYY-MM-DD
            const qty = Number(t.quantity);
            const revenue = qty * t.product.selling_price;
            const profit = qty * (t.product.selling_price - t.product.unit_cost);

            if (date === startOfDay) {
                stats.today.revenue += revenue;
                stats.today.profit += profit;
                stats.today.count += qty;
            }
            if (date >= startOfWeek) {
                stats.week.revenue += revenue;
                stats.week.profit += profit;
                stats.week.count += qty;
            }
            if (date >= startOfMonth) {
                stats.month.revenue += revenue;
                stats.month.profit += profit;
                stats.month.count += qty;
            }
            if (date >= startOfYear) {
                stats.year.revenue += revenue;
                stats.year.profit += profit;
                stats.year.count += qty;
            }
        });

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
