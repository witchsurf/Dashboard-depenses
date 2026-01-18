
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

    const { data: products } = await supabase.from('t_wake_products').select('*');
    const { data: transactions } = await supabase.from('t_wake_transactions').select('*');

    return NextResponse.json({
        products,
        transactions
    });
}
