
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

    // ID of the Typo product "BICSCUIT VANILLE"
    const badId = '46ef195e-ac56-4357-9070-c070785388ee';

    const { error } = await supabase
        .from('t_wake_products')
        .delete()
        .eq('id', badId);

    if (error) return NextResponse.json({ success: false, error: error.message });

    return NextResponse.json({ success: true, message: 'Deleted duplicate product' });
}
