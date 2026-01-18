
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { persistSession: false },
            global: { headers: { 'Cache-Control': 'no-store' } }
        }
    );
}

export async function GET() {
    const supabase = getSupabaseClient();

    // 1. Fetch T-WAKE raw
    const { data: tWakeRaw, error: tWakeError } = await supabase
        .from('t_wake_transactions')
        .select(`
            *,
            product:t_wake_products (name, selling_price, unit_cost)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    // 2. Fetch Expenses raw
    const { data: expensesRaw } = await supabase
        .from('expenses')
        .select('id, category, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    return NextResponse.json({
        tWakeCount: tWakeRaw?.length,
        tWakeSample: tWakeRaw,
        expenseSample: expensesRaw,
        error: tWakeError
    });
}
