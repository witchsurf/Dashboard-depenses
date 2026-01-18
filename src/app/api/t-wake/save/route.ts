
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

// POST: Save sales corrections from Grid
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sales } = body; // Array of { productId, month (YYYY-MM-01), quantity } (The NEW total)

        if (!sales || !Array.isArray(sales)) {
            return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
        }

        const supabase = getSupabaseClient();

        // We need to calculate the difference to insert adjustment transactions.
        // 1. Fetch current totals for specific products/months involved?
        // Or just trust the frontend? Frontend might not know the exact "old" value if checking against race conditions, but let's assume frontend logic:
        // Actually, the Grid sends the target Quantity.
        // Backend must fetch current total to calc diff.

        // Optimization: Fetch all transactions for these products/months?
        // Let's loop (not efficient but safe for small batches).

        const errors: string[] = [];
        let savedCount = 0;

        for (const sale of sales) {
            const { productId, month, quantity } = sale;
            if (!productId || !month) continue;

            const targetQty = Number(quantity);

            // Fetch current total for this product/month
            // month is 'YYYY-MM-01'. Range is that month.
            const startDate = month;
            const d = new Date(month);
            const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]; // End of month

            const { data: trans, error: fetchError } = await supabase
                .from('t_wake_transactions')
                .select('quantity')
                .eq('product_id', productId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (fetchError) {
                errors.push(`Fetch error ${productId}: ${fetchError.message}`);
                continue;
            }

            const currentTotal = trans?.reduce((sum, t) => sum + Number(t.quantity), 0) || 0;
            const diff = targetQty - currentTotal;

            if (diff !== 0) {
                // Insert adjustment transaction
                const { error: insertError } = await supabase
                    .from('t_wake_transactions')
                    .insert({
                        product_id: productId,
                        date: startDate, // First of month for adjustments
                        quantity: diff,
                        description: 'Grid Manual Adjustment'
                    });

                if (insertError) {
                    errors.push(`Update error ${productId}: ${insertError.message}`);
                } else {
                    savedCount++;

                    // Real-time Sync to Google Sheets
                    try {
                        const { data: prod } = await supabase
                            .from('t_wake_products')
                            .select('name')
                            .eq('id', productId)
                            .single();

                        if (prod?.name) {
                            const d = new Date(startDate);
                            if (d.getFullYear() === 2026) {
                                const { updateTWakeCell } = await import('@/lib/sheets');
                                await updateTWakeCell(prod.name, d.getMonth(), targetQty);
                                console.log(`Synced ${prod.name} for Month ${d.getMonth()} with Total ${targetQty}`);
                            }
                        }
                    } catch (syncError) {
                        console.error('Real-time sync failed:', syncError);
                    }
                }
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ success: false, error: errors.join(', ') });
        }

        return NextResponse.json({ success: true, saved: savedCount });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
