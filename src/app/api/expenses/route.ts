import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendExpenseToSheet } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    return createClient(url, key);
}

/**
 * POST /api/expenses - Add new expense to Supabase and Google Sheets
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, amount, category, subcategory, description } = body;

        // Validate input
        if (!date || !amount || !category) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                synced: false,
                message: 'Saved locally (Supabase not configured)',
            });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                date,
                amount,
                category,
                subcategory,
                description,
                synced_from_local: false,
            }])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json({
                success: true,
                synced: false,
                message: 'Saved locally (database error)',
                error: error.message,
            });
        }

        // Sync to Google Sheets
        let sheetSynced = false;
        try {
            const sheetResult = await appendExpenseToSheet(
                category,
                subcategory || '',
                amount,
                new Date(date)
            );
            sheetSynced = sheetResult.success;
            if (!sheetResult.success && sheetResult.error) {
                console.log('Google Sheets sync skipped:', sheetResult.error);
            }
        } catch (sheetError) {
            console.log('Google Sheets sync error (non-blocking):', sheetError);
        }

        return NextResponse.json({
            success: true,
            synced: true,
            sheetSynced,
            message: sheetSynced ? 'Saved to database and Google Sheets' : 'Saved to database',
            data,
        });

    } catch (error) {
        console.error('Expense API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/expenses - Get expenses from Supabase
 */
export async function GET(request: Request) {
    try {
        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');
        const limit = searchParams.get('limit');

        let query = supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        if (category) query = query.eq('category', category);
        if (limit) query = query.limit(parseInt(limit));

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data,
            count: data?.length || 0,
        });

    } catch (error) {
        console.error('Expense GET Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/expenses - Delete expense from Supabase
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing expense ID' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            });
        }

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Expense deleted',
        });

    } catch (error) {
        console.error('Expense DELETE Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
