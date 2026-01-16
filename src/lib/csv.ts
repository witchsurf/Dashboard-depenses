import { SheetData, SheetRow } from '@/types';
import { parseFrenchNumber } from './utils';

/**
 * CSV data fetcher - fallback when Sheets API is not configured
 * 
 * Required environment variable:
 * - SHEET_CSV_URL
 */

/**
 * Get CSV URL from environment
 */
export function getCSVUrl(): string | null {
    return process.env.SHEET_CSV_URL || null;
}

/**
 * Check if CSV mode is configured
 */
export function isCSVConfigured(): boolean {
    return getCSVUrl() !== null;
}

/**
 * Parse CSV content to structured data
 */
function parseCSV(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                // Escaped quote
                currentCell += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                // End of quoted field
                inQuotes = false;
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
            } else if (char === ',' || char === ';') {
                // Field separator (support both comma and semicolon)
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\r' && nextChar === '\n') {
                // Windows line ending
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                i++; // Skip \n
            } else if (char === '\n') {
                // Unix line ending
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
    }

    // Don't forget the last cell and row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return rows;
}

/**
 * Fetch and parse CSV data
 */
export async function fetchCSVData(url?: string): Promise<SheetData> {
    const csvUrl = url || getCSVUrl();
    if (!csvUrl) {
        throw new Error('CSV URL not configured');
    }

    const response = await fetch(csvUrl, {
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    const values = parseCSV(content);

    if (values.length === 0) {
        return {
            headers: [],
            rows: [],
            sheetName: 'CSV',
            lastUpdated: new Date(),
        };
    }

    // Find header row (first row with multiple non-empty cells)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, values.length); i++) {
        const row = values[i];
        const nonEmptyCount = row.filter(cell => cell && cell.trim() !== '').length;
        if (nonEmptyCount >= 3) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = values[headerRowIndex].map((h, i) => h?.trim() || `Column${i + 1}`);
    const rows: SheetRow[] = [];

    for (let i = headerRowIndex + 1; i < values.length; i++) {
        const rowData = values[i];
        if (!rowData || rowData.every(cell => !cell || cell.trim() === '')) {
            continue; // Skip empty rows
        }

        const row: SheetRow = {};
        for (let j = 0; j < headers.length; j++) {
            const value = rowData[j] || '';
            const trimmedValue = value.trim();

            // Try to parse as number
            const numValue = parseFrenchNumber(trimmedValue);
            if (trimmedValue !== '' && !isNaN(numValue) && /^[\d\s,.\-]+$/.test(trimmedValue)) {
                row[headers[j]] = numValue;
            } else {
                row[headers[j]] = trimmedValue || null;
            }
        }
        rows.push(row);
    }

    return {
        headers,
        rows,
        sheetName: 'CSV',
        lastUpdated: new Date(),
    };
}

/**
 * Construct Google Sheets CSV export URL from sheet ID
 */
export function getGoogleSheetsCSVUrl(sheetId: string, gid?: string): string {
    const baseUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    return gid ? `${baseUrl}&gid=${gid}` : baseUrl;
}
