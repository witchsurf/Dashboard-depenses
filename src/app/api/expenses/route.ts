import { NextResponse } from 'next/server';
import { getSheetsConfig } from '@/lib/sheets';

export const dynamic = 'force-dynamic';

/**
 * API to save expense to Google Sheets
 * POST /api/expenses - Add new expense
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

        const config = getSheetsConfig();

        if (!config) {
            // API not configured, just acknowledge receipt
            return NextResponse.json({
                success: true,
                synced: false,
                message: 'Saved locally (Google Sheets API not configured)',
            });
        }

        // TODO: Implement Google Sheets append when credentials are properly configured
        // For now, we'll use the CSV approach which is read-only

        return NextResponse.json({
            success: true,
            synced: false,
            message: 'Saved locally (sync pending)',
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
 * GET /api/expenses - Get local expenses summary
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Use localStorage on client for expenses',
    });
}
