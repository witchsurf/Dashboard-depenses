import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncCategoryToSheet } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sync-to-sheets - Sync all Supabase expenses to Google Sheets
 * Writes exact totals from Supabase (source of truth)
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

        // Get distinct category/subcategory combinations for January 2026
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select('category, subcategory')
            .gte('date', '2026-01-01')
            .lt('date', '2026-02-01');

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
            }, { status: 500 });
        }

        // Get unique category/subcategory combinations
        const uniqueCombos = new Set<string>();
        expenses?.forEach(e => {
            uniqueCombos.add(`${e.category}|${e.subcategory || ''}`);
        });

        const results = {
            total: uniqueCombos.size,
            synced: 0,
            skipped: 0,
            details: [] as { category: string; subcategory: string; total: number }[],
            errors: [] as string[],
        };

        // Sync each unique category/subcategory to Google Sheets
        for (const combo of Array.from(uniqueCombos)) {
            const [category, subcategory] = combo.split('|');
            try {
                const result = await syncCategoryToSheet(
                    category,
                    subcategory,
                    0, // January = month 0
                    2026
                );

                if (result.success) {
                    results.synced++;
                    if (result.total !== undefined) {
                        results.details.push({ category, subcategory, total: result.total });
                    }
                } else {
                    results.skipped++;
                    if (result.error) {
                        results.errors.push(`${category}/${subcategory}: ${result.error}`);
                    }
                }
            } catch (err) {
                results.skipped++;
                results.errors.push(`${category}/${subcategory}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync completed: ${results.synced}/${results.total} categories synced`,
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
        note: 'This writes EXACT TOTALS from Supabase (source of truth) - safe to run multiple times',
    });
}
