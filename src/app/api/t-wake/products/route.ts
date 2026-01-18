
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

/**
 * POST /api/t-wake/products
 * Create a new product
 * body: { name, selling_price, unit_cost }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, selling_price, unit_cost, skipSheetAppend } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('t_wake_products')
            .insert({
                name,
                selling_price: parseFloat(selling_price) || 0,
                unit_cost: parseFloat(unit_cost) || 0
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // --- Append to Google Sheet ---
        if (!skipSheetAppend) {
            try {
                const { getSheetsConfig, getAccessToken } = await import('@/lib/sheets');
                const config = getSheetsConfig();

                if (config) {
                    const accessToken = await getAccessToken(config);
                    const sheetName = 'Cakes/Biscuits';

                    // Check if already exists in Sheet (to avoid dupes if user typed existing name manually)
                    // Actually, reading whole sheet is expensive. Let's assume if it's new in DB, we should append unless it was an existing suggestion.
                    // Improving: We can just append.

                    const values = [[
                        name,
                        parseFloat(selling_price) || 0,
                        parseFloat(unit_cost) || 0
                    ]];

                    await fetch(
                        `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/'${sheetName}'!A:C:append?valueInputOption=USER_ENTERED`,
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ values })
                        }
                    );
                }
            } catch (sheetError) {
                console.error('Failed to append to sheet:', sheetError);
                // Don't fail the request, just log
            }
        }

        return NextResponse.json({ success: true, product: data });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
