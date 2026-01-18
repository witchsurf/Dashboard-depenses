
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * GET: Fetch recent transactions
 * POST: Create new transaction
 */

export async function GET() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('t_wake_transactions')
        .select(`
            *,
            product:t_wake_products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return NextResponse.json({ success: false, error: error.message });
    return NextResponse.json({ success: true, transactions: data });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { product_id, date, quantity, description } = body;

        if (!product_id || !date || quantity === undefined) {
            return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('t_wake_transactions')
            .insert({
                product_id,
                date,
                quantity,
                description
            })
            .select()
            .single();

        if (error) throw error;

        // Note: We are NO LONGER appending to Google Sheets row-by-row for sales.
        // We rely on the "Sync" button to aggregate and update monthly columns.
        // This is safer and cleaner than appending transaction logs to a monthly budget sheet.

        return NextResponse.json({ success: true, transaction: data });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
