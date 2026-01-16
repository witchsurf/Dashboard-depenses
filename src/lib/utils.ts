import { type ClassValue, clsx } from 'clsx';

// Simple clsx implementation
export function cn(...inputs: (string | undefined | null | false | Record<string, boolean>)[]): string {
    return inputs
        .filter(Boolean)
        .map((input) => {
            if (typeof input === 'string') return input;
            if (typeof input === 'object' && input !== null) {
                return Object.entries(input)
                    .filter(([, value]) => value)
                    .map(([key]) => key)
                    .join(' ');
            }
            return '';
        })
        .join(' ');
}

// Format number as currency (French format - CFA)
export function formatCurrency(value: number, currency: string = 'XAF'): string {
    // XAF doesn't format nicely in all locales, so we format manually
    const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
    return `${formatted} CFA`;
}

// Format number with French locale
export function formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
}

// Parse French number format (comma as decimal separator)
export function parseFrenchNumber(value: string): number {
    if (!value || value.trim() === '') return 0;
    // Remove spaces and replace comma with dot
    const normalized = value.toString().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
}

// Determine if a string looks like a date
export function looksLikeDate(value: string): boolean {
    const datePatterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // DD/MM/YYYY or D/M/YY
        /^\d{4}-\d{2}-\d{2}$/,          // YYYY-MM-DD
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,    // DD-MM-YYYY
    ];
    return datePatterns.some(pattern => pattern.test(value.trim()));
}

// Determine if a string looks like a number
export function looksLikeNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    const normalized = value.toString().replace(/\s/g, '').replace(',', '.');
    return !isNaN(parseFloat(normalized)) && isFinite(parseFloat(normalized));
}

// French month names
export const FRENCH_MONTHS = [
    'JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN',
    'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'
];

export const FRENCH_MONTHS_FULL = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Check if a value is a month header
export function isMonthHeader(value: string): boolean {
    if (!value) return false;
    const normalized = value.toUpperCase().trim();
    return FRENCH_MONTHS.includes(normalized) ||
        FRENCH_MONTHS_FULL.some(m => m.toUpperCase() === normalized);
}

// Calculate percentage change
export function calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
}

// Get trend direction
export function getTrend(change: number): 'up' | 'down' | 'stable' {
    if (change > 1) return 'up';
    if (change < -1) return 'down';
    return 'stable';
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Generate colors for charts
export const CHART_COLORS = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#EF4444', // Red
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#84CC16', // Lime
];

export function getChartColor(index: number): string {
    return CHART_COLORS[index % CHART_COLORS.length];
}

// Export data as CSV
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(';'),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(';')
        )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}
