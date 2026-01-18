
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

        // Fetch products
        const { data: products, error: prodError } = await supabase
            .from('t_wake_products')
            .select('*')
            .order('name');

        if (prodError) throw prodError;

        // Fetch transactions (aggregated in JS)
        // Optimally we would filter by year, but for now fetch all
        const { data: transactions, error: transError } = await supabase
            .from('t_wake_transactions')
            .select('product_id, date, quantity');

        if (transError) throw transError;

        // Aggregate into sales [{ product_id, month, quantity }]
        // Month format: YYYY-MM-01

        const aggregation = new Map<string, number>(); // Key: "productId|YYYY-MM-01" -> Qty

        transactions?.forEach((t: any) => {
            if (!t.date) return;
            const dateObj = new Date(t.date);
            const key = `${t.product_id}|${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
            const current = aggregation.get(key) || 0;
            aggregation.set(key, current + Number(t.quantity));
        });

        const sales = Array.from(aggregation.entries()).map(([key, quantity]) => {
            const [product_id, month] = key.split('|');
            return { product_id, month, quantity };
        });

        return NextResponse.json({ success: true, products, sales });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
