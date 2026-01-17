import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchSheetData, isSheetsConfigured } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

/**
 * POST /api/import - Import data from Google Sheets to Supabase
 */
export async function POST(request: Request) {
    try {
        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        if (!isSheetsConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Google Sheets not configured',
            }, { status: 500 });
        }

        // Fetch data from Google Sheets
        const sheetData = await fetchSheetData();

        if (!sheetData || sheetData.rows.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'No data found in Google Sheets',
            }, { status: 404 });
        }

        // Parse the request body to know what to import
        const body = await request.json().catch(() => ({}));
        const { importType = 'expenses' } = body;

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        // Detect column names
        const headers = sheetData.headers.map(h => h.toLowerCase());

        // Find relevant columns
        const dateCol = headers.findIndex(h =>
            h.includes('date') || h.includes('jour') || h.includes('mois')
        );
        const amountCol = headers.findIndex(h =>
            h.includes('montant') || h.includes('total') || h.includes('somme') || h.includes('amount')
        );
        const categoryCol = headers.findIndex(h =>
            h.includes('categ') || h.includes('poste') || h.includes('type')
        );
        const descCol = headers.findIndex(h =>
            h.includes('desc') || h.includes('libel') || h.includes('detail')
        );

        console.log('Columns detected:', { dateCol, amountCol, categoryCol, descCol });
        console.log('Headers:', sheetData.headers);

        for (const row of sheetData.rows) {
            try {
                // Get values by column index or key
                const headerKeys = Object.keys(row);

                let date = dateCol >= 0 ? row[sheetData.headers[dateCol]] : null;
                let amount = amountCol >= 0 ? row[sheetData.headers[amountCol]] : null;
                let category = categoryCol >= 0 ? row[sheetData.headers[categoryCol]] : null;
                let description = descCol >= 0 ? row[sheetData.headers[descCol]] : null;

                // Skip if missing required fields
                if (!amount || (typeof amount === 'number' && isNaN(amount))) {
                    skipped++;
                    continue;
                }

                // Parse amount
                let numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^\d.-]/g, ''));
                if (isNaN(numAmount) || numAmount === 0) {
                    skipped++;
                    continue;
                }

                // Parse date
                let parsedDate = new Date();
                if (date) {
                    if (typeof date === 'string') {
                        // Try to parse date
                        const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
                        if (dateMatch) {
                            const [, d, m, y] = dateMatch;
                            const year = y.length === 2 ? `20${y}` : y;
                            parsedDate = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
                        }
                    } else if (typeof date === 'object' && date !== null) {
                        // Assume it's a Date-like object
                        parsedDate = new Date(date as Date);
                    }
                }

                const dateStr = parsedDate.toISOString().split('T')[0];

                // Determine if income or expense based on sign or category
                const isIncome = numAmount > 0 && category &&
                    (String(category).toLowerCase().includes('revenu') ||
                        String(category).toLowerCase().includes('salaire') ||
                        String(category).toLowerCase().includes('income'));

                if (isIncome) {
                    const { error } = await supabase
                        .from('income')
                        .insert([{
                            date: dateStr,
                            amount: Math.abs(numAmount),
                            source: String(category || 'Import'),
                            description: description ? String(description) : null,
                        }]);

                    if (error) {
                        errors.push(`Income: ${error.message}`);
                    } else {
                        imported++;
                    }
                } else {
                    const { error } = await supabase
                        .from('expenses')
                        .insert([{
                            date: dateStr,
                            amount: Math.abs(numAmount),
                            category: String(category || 'AUTRES'),
                            subcategory: null,
                            description: description ? String(description) : null,
                            synced_from_local: false,
                        }]);

                    if (error) {
                        errors.push(`Expense: ${error.message}`);
                    } else {
                        imported++;
                    }
                }
            } catch (rowError) {
                skipped++;
                console.error('Row error:', rowError);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import completed`,
            stats: {
                totalRows: sheetData.rows.length,
                imported,
                skipped,
                errors: errors.slice(0, 5), // Limit errors shown
            },
        });

    } catch (error) {
        console.error('Import Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * GET /api/import - Preview data from Google Sheets
 */
export async function GET() {
    try {
        if (!isSheetsConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Google Sheets not configured',
            }, { status: 500 });
        }

        const sheetData = await fetchSheetData();

        return NextResponse.json({
            success: true,
            preview: {
                headers: sheetData.headers,
                sampleRows: sheetData.rows.slice(0, 5),
                totalRows: sheetData.rows.length,
            },
        });

    } catch (error) {
        console.error('Preview Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
