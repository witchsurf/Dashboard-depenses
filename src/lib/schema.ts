import { ColumnSchema } from '@/types';
import { looksLikeDate, looksLikeNumber, isMonthHeader, FRENCH_MONTHS } from './utils';

export interface SchemaInferenceResult {
    schemas: ColumnSchema[];
    suggestedMapping: {
        dateColumn: string | null;
        valueColumns: string[];
        categoryColumns: string[];
    };
}

/**
 * Infer column types from data samples
 */
export function inferColumnTypes(
    headers: string[],
    rows: Record<string, string | number | null>[]
): SchemaInferenceResult {
    const schemas: ColumnSchema[] = [];
    const valueColumns: string[] = [];
    const categoryColumns: string[] = [];
    let dateColumn: string | null = null;

    for (const header of headers) {
        if (!header || header.trim() === '') continue;

        // Check if header is a month name
        if (isMonthHeader(header)) {
            schemas.push({
                name: header,
                type: 'numeric',
                isComputed: false,
            });
            valueColumns.push(header);
            continue;
        }

        // Check for computed columns
        if (['Total', 'Moyenne', 'Average', 'Sum'].some(h =>
            header.toLowerCase().includes(h.toLowerCase())
        )) {
            schemas.push({
                name: header,
                type: 'numeric',
                isComputed: true,
            });
            continue;
        }

        // Sample values from rows
        const samples = rows
            .slice(0, Math.min(20, rows.length))
            .map(row => row[header])
            .filter(v => v !== null && v !== undefined && v !== '');

        if (samples.length === 0) {
            schemas.push({
                name: header,
                type: 'text',
            });
            categoryColumns.push(header);
            continue;
        }

        // Analyze samples
        const dateCount = samples.filter(v => looksLikeDate(String(v))).length;
        const numberCount = samples.filter(v => looksLikeNumber(String(v))).length;

        const dateRatio = dateCount / samples.length;
        const numberRatio = numberCount / samples.length;

        if (dateRatio > 0.7) {
            schemas.push({
                name: header,
                type: 'date',
                format: 'DD/MM/YYYY',
            });
            if (!dateColumn) dateColumn = header;
        } else if (numberRatio > 0.5) {
            schemas.push({
                name: header,
                type: 'numeric',
            });
            valueColumns.push(header);
        } else {
            // Check for categorical data (limited unique values)
            const uniqueValues = new Set(samples.map(String));
            if (uniqueValues.size <= Math.min(20, samples.length * 0.5)) {
                schemas.push({
                    name: header,
                    type: 'category',
                });
                categoryColumns.push(header);
            } else {
                schemas.push({
                    name: header,
                    type: 'text',
                });
                categoryColumns.push(header);
            }
        }
    }

    return {
        schemas,
        suggestedMapping: {
            dateColumn,
            valueColumns,
            categoryColumns,
        },
    };
}

/**
 * Detect budget-specific structure (categories as rows, months as columns)
 */
export function detectBudgetStructure(
    headers: string[],
    rows: Record<string, string | number | null>[]
): {
    isBudgetFormat: boolean;
    monthColumns: string[];
    categoryColumn: string | null;
    totalColumn: string | null;
    averageColumn: string | null;
} {
    // Find month columns
    const monthColumns = headers.filter(h => isMonthHeader(h));
    const isBudgetFormat = monthColumns.length >= 6;

    // Find special columns
    const totalColumn = headers.find(h =>
        h?.toLowerCase().includes('total') && !isMonthHeader(h)
    ) || null;

    const averageColumn = headers.find(h =>
        h?.toLowerCase().includes('moyenne') || h?.toLowerCase().includes('average')
    ) || null;

    // First column is usually the category name
    const categoryColumn = headers.find(h =>
        h && !isMonthHeader(h) && h !== totalColumn && h !== averageColumn
    ) || headers[0] || null;

    return {
        isBudgetFormat,
        monthColumns,
        categoryColumn,
        totalColumn,
        averageColumn,
    };
}

/**
 * Extract budget categories from rows
 */
export function extractBudgetCategories(
    rows: Record<string, string | number | null>[],
    categoryColumn: string
): string[] {
    const categories = new Set<string>();

    for (const row of rows) {
        const value = row[categoryColumn];
        if (value && typeof value === 'string') {
            const trimmed = value.trim();
            // Skip empty rows, headers, and totals
            if (trimmed &&
                !trimmed.startsWith('Total') &&
                !trimmed.startsWith('NET') &&
                !trimmed.startsWith('Solde') &&
                trimmed.toUpperCase() !== trimmed) { // Skip all-caps section headers
                categories.add(trimmed);
            }
        }
    }

    return Array.from(categories);
}

/**
 * Identify section headers (all caps categories like REVENUS, MAISON, etc.)
 */
export function identifySectionHeaders(
    rows: Record<string, string | number | null>[],
    categoryColumn: string
): string[] {
    const sections: string[] = [];

    for (const row of rows) {
        const value = row[categoryColumn];
        if (value && typeof value === 'string') {
            const trimmed = value.trim();
            // Section headers are typically all caps and not "Total" rows
            if (trimmed.length > 2 &&
                trimmed === trimmed.toUpperCase() &&
                !trimmed.startsWith('TOTAL') &&
                !trimmed.startsWith('NET')) {
                sections.push(trimmed);
            }
        }
    }

    return sections;
}
