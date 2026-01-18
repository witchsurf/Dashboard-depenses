
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
        global: { headers: { 'Cache-Control': 'no-store' } }
    });
}

/**
 * GET /api/t-wake/data
 * Returns products and their sales
 */
export async function GET() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        // Fetch products
        const { data: products, error: prodError } = await supabase
            .from('t_wake_products')
            .select('*')
            .order('name');

        if (prodError) throw prodError;

        // Fetch sales
        const { data: sales, error: salesError } = await supabase
            .from('t_wake_sales')
            .select('*');

        if (salesError) throw salesError;

        return NextResponse.json({
            success: true,
            products: products || [],
            sales: sales || []
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
