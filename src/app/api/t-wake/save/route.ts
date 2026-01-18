
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
 * POST /api/t-wake/save
 * Save sales data
 * body: { sales: [{ productId, month, quantity }] }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sales } = body;

        if (!Array.isArray(sales)) {
            return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { error } = await supabase
            .from('t_wake_sales')
            .upsert(
                sales.map(s => ({
                    product_id: s.productId,
                    month: s.month, // 'YYYY-MM-01'
                    quantity: s.quantity,
                    last_updated: new Date().toISOString()
                })),
                { onConflict: 'product_id, month' }
            );

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
