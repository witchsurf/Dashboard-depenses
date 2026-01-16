import { NextResponse } from 'next/server';
import { fetchData, getDataSourceConfig, getDataSourceMode } from '@/lib/data-fetcher';
import { inferColumnTypes, detectBudgetStructure } from '@/lib/schema';

export const revalidate = 300; // Revalidate every 5 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || undefined;

        const config = await getDataSourceConfig();
        const data = await fetchData(tab);

        // Infer schema from data
        const schemaResult = inferColumnTypes(data.headers, data.rows);
        const budgetStructure = detectBudgetStructure(data.headers, data.rows);

        return NextResponse.json({
            success: true,
            config,
            data,
            schema: schemaResult.schemas,
            suggestedMapping: schemaResult.suggestedMapping,
            budgetStructure,
            mode: getDataSourceMode(),
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                mode: getDataSourceMode(),
            },
            { status: 500 }
        );
    }
}
