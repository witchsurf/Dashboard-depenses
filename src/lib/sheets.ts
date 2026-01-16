import { SheetData, SheetRow } from '@/types';
import { parseFrenchNumber } from './utils';

/**
 * Google Sheets API v4 integration
 * 
 * Required environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_SHEET_ID
 */

interface SheetsConfig {
    serviceAccountEmail: string;
    privateKey: string;
    sheetId: string;
}

/**
 * Get configuration from environment variables
 */
export function getSheetsConfig(): SheetsConfig | null {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !privateKey || !sheetId) {
        return null;
    }

    return {
        serviceAccountEmail,
        privateKey,
        sheetId,
    };
}

/**
 * Check if Sheets API is configured
 */
export function isSheetsConfigured(): boolean {
    return getSheetsConfig() !== null;
}

/**
 * Create JWT token for Google API authentication
 */
async function createJWT(config: SheetsConfig): Promise<string> {
    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: config.serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const unsignedToken = `${base64Header}.${base64Payload}`;

    // Sign with RSA-SHA256
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    const signature = sign.sign(config.privateKey, 'base64url');

    return `${unsignedToken}.${signature}`;
}

/**
 * Get access token from Google OAuth
 */
async function getAccessToken(config: SheetsConfig): Promise<string> {
    const jwt = await createJWT(config);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Fetch available sheet tabs
 */
export async function fetchSheetTabs(): Promise<string[]> {
    const config = getSheetsConfig();
    if (!config) {
        throw new Error('Google Sheets API not configured');
    }

    const accessToken = await getAccessToken(config);

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}?fields=sheets.properties.title`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch sheet tabs: ${error}`);
    }

    const data = await response.json();
    return data.sheets.map((sheet: { properties: { title: string } }) => sheet.properties.title);
}

/**
 * Fetch sheet data by tab name
 */
export async function fetchSheetData(tabName?: string): Promise<SheetData> {
    const config = getSheetsConfig();
    if (!config) {
        throw new Error('Google Sheets API not configured');
    }

    const accessToken = await getAccessToken(config);
    const range = tabName ? `'${tabName}'` : 'A:Z';

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(range)}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch sheet data: ${error}`);
    }

    const data = await response.json();
    const values: string[][] = data.values || [];

    if (values.length === 0) {
        return {
            headers: [],
            rows: [],
            sheetName: tabName || 'Sheet1',
            lastUpdated: new Date(),
        };
    }

    // First non-empty row with content is headers
    let headerRowIndex = 0;
    for (let i = 0; i < values.length; i++) {
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
        sheetName: tabName || 'Sheet1',
        lastUpdated: new Date(),
    };
}
