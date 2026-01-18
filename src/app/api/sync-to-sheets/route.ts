import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendExpenseToSheet } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sync-to-sheets - Sync all Supabase expenses to Google Sheets
 * This is a one-time migration endpoint
 */
export async function POST() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        const supabase = createClient(url, key);

        // Get all expenses from January 2026
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', '2026-01-01')
            .lt('date', '2026-02-01')
            .order('date', { ascending: true });

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        const results = {
            total: expenses?.length || 0,
            synced: 0,
            skipped: 0,
            errors: [] as string[],
        };

        // Sync each expense to Google Sheets
        for (const expense of expenses || []) {
            try {
                const result = await appendExpenseToSheet(
                    expense.category,
                    expense.subcategory || '',
                    expense.amount,
                    new Date(expense.date)
                );

                if (result.success) {
                    results.synced++;
                } else {
                    results.skipped++;
                    if (result.error) {
                        results.errors.push(`${expense.category}/${expense.subcategory}: ${result.error}`);
                    }
                }
            } catch (err) {
                results.skipped++;
                results.errors.push(`${expense.category}/${expense.subcategory}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync completed: ${results.synced}/${results.total} expenses synced`,
            results,
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * GET /api/sync-to-sheets - Get sync status info
 */
export async function GET() {
    return NextResponse.json({
        info: 'POST to this endpoint to sync all January 2026 expenses from Supabase to Google Sheets',
        warning: 'This will ADD amounts to existing values in Google Sheets - run only once!',
    });
}
