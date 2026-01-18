
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
 * POST /api/t-wake/products
 * Create a new product
 * body: { name, selling_price, unit_cost }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, selling_price, unit_cost } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('t_wake_products')
            .insert({
                name,
                selling_price: parseFloat(selling_price) || 0,
                unit_cost: parseFloat(unit_cost) || 0
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, product: data });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
