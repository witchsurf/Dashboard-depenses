
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSheetsConfig, getAccessToken } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute max

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST() {
    try {
        const supabase = getSupabaseClient();
        const config = getSheetsConfig();
        if (!config) return NextResponse.json({ success: false, error: 'Config missing' });
        const accessToken = await getAccessToken(config);

        // 1. Fetch Aggregated Data from Transactions
        const { data: transactions, error: transError } = await supabase
            .from('t_wake_transactions')
            .select('product_id, date, quantity, product:t_wake_products(name)');

        if (transError) throw transError;

        // Map<ProductName, Map<MonthIndex, Quantity>>
        // MonthIndex: 0-11 for 2026 (assumed)
        const budgetYear = 2026;
        const salesMap = new Map<string, Map<number, number>>();

        transactions?.forEach((t: any) => {
            const prodName = t.product?.name;
            if (!prodName) return;

            const d = new Date(t.date);
            if (d.getFullYear() !== budgetYear) return; // Only sync current year

            if (!salesMap.has(prodName)) {
                salesMap.set(prodName, new Map());
            }

            const monthIdx = d.getMonth(); // 0-11
            const current = salesMap.get(prodName)?.get(monthIdx) || 0;
            salesMap.get(prodName)?.set(monthIdx, current + Number(t.quantity));
        });

        // 2. Read Sheet Rows to find mapping
        const sheetName = 'Cakes/Biscuits';
        const range = `'${sheetName}'!A3:A100`; // Just names
        const res = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const sheetData = await res.json();
        const rows = sheetData.values || [];

        // 3. Prepare Batch Update
        const updates: any[] = [];
        const monthStartColIndex = 4; // Col E is index 4 (Jan)

        rows.forEach((row: any, i: number) => {
            const name = row[0];
            if (!name) return;

            const productSales = salesMap.get(name);
            if (productSales) {
                const sheetRowIndex = 3 + i; // Data starts at A3 -> index 0 corresponds to row 3
                // Row is 1-based, index is 0-based. But API uses A1 or R1C1.
                // Range `'Sheet'!E{Row}:P{Row}`

                const rowValues = [];
                for (let m = 0; m < 12; m++) {
                    const qty = productSales.get(m) || 0;
                    rowValues.push(qty === 0 ? '' : qty);
                }

                updates.push({
                    range: `'${sheetName}'!E${sheetRowIndex}:P${sheetRowIndex}`,
                    values: [rowValues]
                });
            }
        });

        if (updates.length > 0) {
            await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values:batchUpdate`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                    body: JSON.stringify({
                        valueInputOption: 'USER_ENTERED',
                        data: updates
                    })
                }
            );
        }

        return NextResponse.json({ success: true, updatedRows: updates.length });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
