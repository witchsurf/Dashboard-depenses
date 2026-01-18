
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSheetsConfig, getAccessToken, parseFrenchNumber } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

/**
 * POST /api/setup-t-wake
 * Seeds T-WAKE data from Google Sheets to Supabase
 */
export async function POST() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const config = getSheetsConfig();
        if (!config) {
            return NextResponse.json({ success: false, error: 'Google Sheets not configured' }, { status: 500 });
        }

        const accessToken = await getAccessToken(config);

        // 1. Get Sheet Data
        // We know the sheet is "Cakes/Biscuits" and data starts at row 3 (A3:Z100)
        // Headers are on row 2.
        // Col A: Name, B: Price, C: Cost
        // Col E (index 4) -> Jan, ... P (index 15) -> Dec

        const range = `'Cakes/Biscuits'!A3:S50`; // Estimate 50 products max for now
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        const data = await response.json();
        const rows = data.values;

        if (!rows || rows.length === 0) {
            return NextResponse.json({ success: false, error: 'No data found in sheet' });
        }

        const stats = {
            productsExpected: rows.length,
            productsInserted: 0,
            salesInserted: 0,
            errors: [] as string[]
        };

        // 2. Process each row
        const currentYear = new Date().getFullYear(); // Assume 2026 based on context actually, user said 2026.
        // Actually the sheet says "JANVIER" etc. usually for current budget year.
        // Context says "Budget 2026". Let's use 2026.
        const year = 2026;

        for (const row of rows) {
            const name = row[0];
            if (!name) continue;

            const sellingPrice = parseFrenchNumber(row[1]) || 0;
            const unitCost = parseFrenchNumber(row[2]) || 0;

            // Upsert Product
            const { data: product, error: prodError } = await supabase
                .from('t_wake_products')
                .upsert({
                    name,
                    selling_price: sellingPrice,
                    unit_cost: unitCost
                }, { onConflict: 'name' })
                .select()
                .single();

            if (prodError) {
                stats.errors.push(`Product ${name}: ${prodError.message}`);
                continue;
            }

            stats.productsInserted++;

            // Upsert Sales for Jan-Dec (Cols E-P / indices 4-15)
            // Jan is index 4
            for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
                const colIdx = 4 + monthIdx;
                if (colIdx >= row.length) break;

                const val = row[colIdx];
                if (!val || val === '') continue; // Skip empty cells

                const qty = parseFrenchNumber(val);
                if (qty === 0) continue; // Skip 0? Maybe keep 0 if it was explicit, but empty is usually skip.

                // Construct date: 2026-01-01, 2026-02-01 etc.
                const monthDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;

                const { error: salesError } = await supabase
                    .from('t_wake_sales')
                    .upsert({
                        product_id: product.id,
                        month: monthDate,
                        quantity: qty
                    }, { onConflict: 'product_id, month' });

                if (salesError) {
                    stats.errors.push(`Sales ${name} ${monthDate}: ${salesError.message}`);
                } else {
                    stats.salesInserted++;
                }
            }
        }

        return NextResponse.json({ success: true, stats });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
