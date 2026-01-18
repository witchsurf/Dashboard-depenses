
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

        // 1. Fetch old sales
        const { data: sales, error: fetchError } = await supabase
            .from('t_wake_sales')
            .select('*');

        if (fetchError) throw fetchError;
        if (!sales || sales.length === 0) return NextResponse.json({ success: true, message: 'No sales to migrate' });

        // 2. Insert into transactions
        const transactions = sales.map((s: any) => ({
            product_id: s.product_id,
            date: s.month, // Assuming month is YYYY-MM-01
            quantity: s.quantity,
            description: 'Migration from legacy sales'
        }));

        const { error: insertError } = await supabase
            .from('t_wake_transactions')
            .insert(transactions);

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            message: `Migrated ${transactions.length} sales to transactions`
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
