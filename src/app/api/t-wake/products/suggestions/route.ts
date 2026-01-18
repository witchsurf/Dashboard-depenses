
import { NextResponse } from 'next/server';
import { getSheetsConfig, getAccessToken, parseFrenchNumber } from '@/lib/sheets';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * GET /api/t-wake/products/suggestions
 * Fetches products from Google Sheet that are NOT yet in Supabase
 */
export async function GET() {
    try {
        const config = getSheetsConfig();
        if (!config) return NextResponse.json({ success: false, error: 'Config missing' });

        const accessToken = await getAccessToken(config);

        // 1. Fetch Supabase products
        const supabase = getSupabaseClient();
        const { data: dbProducts } = await supabase.from('t_wake_products').select('name');
        const existingNames = new Set(dbProducts?.map(p => p.name.toLowerCase()) || []);

        // 2. Fetch Sheet products
        const sheetName = 'Cakes/Biscuits';
        const range = `'${sheetName}'!A3:C100`; // A=Name, B=Price, C=Cost

        const readResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const readData = await readResponse.json();
        const rows = readData.values || [];

        // 3. Filter products not in DB
        const suggestions = rows
            .map((row: any[]) => {
                const name = row[0];
                if (!name) return null;
                return {
                    name,
                    selling_price: parseFrenchNumber(row[1]),
                    unit_cost: parseFrenchNumber(row[2])
                };
            })
            .filter((p: any) => p !== null && !existingNames.has(p.name.toLowerCase()));

        return NextResponse.json({ success: true, suggestions });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
