
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSheetsConfig, getAccessToken } from '@/lib/sheets';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for sync

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

/**
 * POST /api/t-wake/sync
 * Syncs Supabase sales data TO Google Sheets
 */
export async function POST() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return NextResponse.json({ success: false, error: 'Supabase missing' });

        const config = getSheetsConfig();
        if (!config) return NextResponse.json({ success: false, error: 'Sheets config missing' });

        const accessToken = await getAccessToken(config);

        // 1. Fetch all sales from Supabase
        const { data: sales, error: salesError } = await supabase
            .from('t_wake_sales')
            .select(`
                quantity,
                month,
                product:t_wake_products (name)
            `);

        if (salesError) throw salesError;

        // Group sales by Product Name and Month Index (0-11)
        // Map<ProductName, Map<MonthIndex, Quantity>>
        const salesMap = new Map<string, Map<number, number>>();

        sales.forEach((s: any) => {
            const prodName = s.product?.name;
            if (!prodName) return;

            if (!salesMap.has(prodName)) {
                salesMap.set(prodName, new Map());
            }

            const monthDate = new Date(s.month);
            const monthIdx = monthDate.getMonth(); // 0-11

            salesMap.get(prodName)?.set(monthIdx, Number(s.quantity));
        });

        // 2. Read Sheet to find Row indices for products
        const sheetName = 'Cakes/Biscuits';
        const range = `'${sheetName}'!A3:A100`; // Read names only

        const readResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const readData = await readResponse.json();
        const rows = readData.values || [];

        // 3. Prepare Batch Update
        const dataToUpdate = [];

        // Iterate rows in sheet
        for (let i = 0; i < rows.length; i++) {
            const rowVerify = rows[i];
            const name = rowVerify[0];
            if (!name) continue;

            const productSales = salesMap.get(name);
            if (!productSales) continue;

            const rowIndex = 3 + i; // Data starts at row 3 (1-based index for API)
            // But API uses row index 0-based? No, A1 notation uses 1-based.
            // Wait, batchUpdate usually uses userEnteredValue which can accept range.

            // We'll update the whole row of months (Jan-Dec are cols E-P)
            // Range: E{rowIndex}:P{rowIndex}

            const monthValues = [];
            for (let m = 0; m < 12; m++) {
                const qty = productSales.get(m);
                monthValues.push(qty !== undefined ? qty : null);
                // Keep null/empty if no data to avoid overwriting with 0 if needed, 
                // but usually syncing implies overwriting. Let's write the number or empty string.
            }

            // Construct values for API: E is index 4
            // Range string
            const updateRange = `'${sheetName}'!E${rowIndex}:P${rowIndex}`;

            dataToUpdate.push({
                range: updateRange,
                values: [monthValues]
            });
        }

        if (dataToUpdate.length === 0) {
            return NextResponse.json({ success: true, message: 'No updates needed' });
        }

        // Execute Batch Update
        const batchResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    valueInputOption: 'USER_ENTERED',
                    data: dataToUpdate
                })
            }
        );

        if (!batchResponse.ok) {
            const err = await batchResponse.text();
            throw new Error(`Sheets API error: ${err}`);
        }

        return NextResponse.json({
            success: true,
            updatedRows: dataToUpdate.length
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
