
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

        // Real-time Sync to Google Sheets (Fire and forget, or await?)
        // We await to ensure consistency for the user's request "chaque ajout..."
        try {
            const d = new Date(date);
            const year = d.getFullYear();

            // Only sync 2026 (or current budget year)
            if (year === 2026) {
                const monthIdx = d.getMonth();
                const monthStart = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
                // Calculate next month correctly handling Dec -> Jan
                const nextD = new Date(year, monthIdx + 1, 1);
                const nextMonth = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-01`;

                // 1. Get Product Name
                const { data: prod } = await supabase
                    .from('t_wake_products')
                    .select('name')
                    .eq('id', product_id)
                    .single();

                // 2. Get New Monthly Total
                const { data: txs } = await supabase
                    .from('t_wake_transactions')
                    .select('quantity')
                    .eq('product_id', product_id)
                    .gte('date', monthStart)
                    .lt('date', nextMonth);

                const total = txs?.reduce((sum, t) => sum + Number(t.quantity), 0) || 0;

                // 3. Update Sheet
                if (prod?.name) {
                    const { updateTWakeCell } = await import('@/lib/sheets');
                    await updateTWakeCell(prod.name, monthIdx, total);
                    console.log(`Synced ${prod.name} for Month ${monthIdx} with Total ${total}`);
                }
            }
        } catch (syncError) {
            console.error('Real-time sync failed:', syncError);
            // Don't fail the request, just log
        }

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
