import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug - Debug endpoint to check Supabase connection
 */
export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const debugInfo = {
        timestamp: new Date().toISOString(),
        env: {
            hasUrl: !!url,
            hasKey: !!key,
            urlPrefix: url ? url.substring(0, 30) + '...' : 'MISSING',
        },
        connection: null as any,
        expenseCount: 0,
        incomeCount: 0,
        sampleExpenses: [] as any[],
        dateFilter: {
            start: '2026-01-01',
            end: '2026-02-01',
        },
    };

    if (!url || !key) {
        return NextResponse.json({
            success: false,
            error: 'Missing Supabase credentials',
            debug: debugInfo,
        });
    }

    try {
        const supabase = createClient(url, key);

        // Test connection by counting expenses
        const { count: totalExpenses, error: countError } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            debugInfo.connection = { error: countError.message };
        } else {
            debugInfo.connection = { status: 'OK' };
            debugInfo.expenseCount = totalExpenses || 0;
        }

        // Get expenses for January 2026
        const { data: janExpenses, error: janError } = await supabase
            .from('expenses')
            .select('id, date, amount, category')
            .gte('date', '2026-01-01')
            .lt('date', '2026-02-01')
            .order('date', { ascending: false })
            .limit(5);

        if (janError) {
            debugInfo.sampleExpenses = [{ error: janError.message }];
        } else {
            debugInfo.sampleExpenses = janExpenses || [];
        }

        // Count income
        const { count: incomeCount } = await supabase
            .from('income')
            .select('*', { count: 'exact', head: true })
            .gte('date', '2026-01-01')
            .lt('date', '2026-02-01');

        debugInfo.incomeCount = incomeCount || 0;

        return NextResponse.json({
            success: true,
            debug: debugInfo,
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            debug: debugInfo,
        });
    }
}
