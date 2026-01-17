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
 * POST /api/income - Add new income
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, amount, source, description } = body;

        if (!date || !amount || !source) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('income')
            .insert([{ date, amount, source, description }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
        });

    } catch (error) {
        console.error('Income API Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * GET /api/income - Get income records
 */
export async function GET(request: Request) {
    try {
        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = searchParams.get('limit');

        let query = supabase
            .from('income')
            .select('*')
            .order('date', { ascending: false });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);
        if (limit) query = query.limit(parseInt(limit));

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data,
            count: data?.length || 0,
        });

    } catch (error) {
        console.error('Income GET Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/**
 * DELETE /api/income - Delete income record
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing income ID' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        if (!supabase) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
            }, { status: 500 });
        }

        const { error } = await supabase
            .from('income')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Income deleted',
        });

    } catch (error) {
        console.error('Income DELETE Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
