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
 * Normalize private key format
 * Handles both escaped \n (from env files) and literal newlines (from Vercel UI)
 */
function normalizePrivateKey(key: string): string {
    // Remove surrounding quotes if present
    let normalized = key.trim();
    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))) {
        normalized = normalized.slice(1, -1);
    }

    // Replace escaped newlines with actual newlines
    normalized = normalized.replace(/\\n/g, '\n');

    // Ensure proper PEM format
    if (!normalized.includes('-----BEGIN')) {
        throw new Error('Invalid private key format');
    }

    return normalized;
}

/**
 * Get configuration from environment variables
 */
export function getSheetsConfig(): SheetsConfig | null {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !rawPrivateKey || !sheetId) {
        return null;
    }

    try {
        const privateKey = normalizePrivateKey(rawPrivateKey);
        return {
            serviceAccountEmail,
            privateKey,
            sheetId,
        };
    } catch (error) {
        console.error('Failed to parse private key:', error);
        return null;
    }
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
        scope: 'https://www.googleapis.com/auth/spreadsheets', // Full access for read/write
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

/**
 * Category to row mapping in Google Sheet (Budget worksheet)
 * Maps category/subcategory to the row number in the sheet
 */
const CATEGORY_ROW_MAP: Record<string, number> = {
    // Maison (starts at row 25)
    'Maison/Loyers/emprunt': 25,
    'Maison/Électricité/gaz': 26,
    'Maison/Essence': 27,
    'Maison/Eau': 28,
    'Maison/Ménage': 29,
    'Maison/Téléphones portables': 30,
    'Maison/Internet': 31,
    'Maison/Cable/Satellite': 32,
    'Maison/Réparation/entretien': 33,
    'Maison/Équipements': 34,
    'Maison/Maintenance': 35,
    'Maison/Déco': 36,
    'Maison/Autre': 37,

    // Vie Quotidienne (starts at row 41)
    'Vie Quotidienne/Courses': 41,
    'Vie Quotidienne/Argent de poche': 42,
    'Vie Quotidienne/Habillement': 43,
    'Vie Quotidienne/Sorties': 44,
    'Vie Quotidienne/Coiffeur': 45,
    'Vie Quotidienne/Divers': 46,

    // Enfants (starts at row 50)
    'Enfants/Habillement/bijoux': 50,
    'Enfants/Frais études': 51,
    'Enfants/Argent de poche': 52,
    'Enfants/Tél/internet': 53,
    'Enfants/Activités': 54,
    'Enfants/Transports': 55,
    'Enfants/Santé': 56,
    'Enfants/Nounou': 57,
    'Enfants/Jeux/loisirs': 58,
    'Enfants/Divers': 59,

    // Transport (starts at row 63)
    'Transport/Voiture': 63,
    'Transport/Essence/électricité': 64,
    'Transport/Réparations/contrôles': 65,
    'Transport/Transport en commun': 66,
    'Transport/Bus/Taxi': 67,
    'Transport/Divers': 68,

    // Santé (starts at row 72)
    'Santé/Médecins/dentiste': 72,
    'Santé/Médicaments/soins': 73,
    'Santé/Mutuelle': 74,
    'Santé/Urgences': 75,
    'Santé/Divers': 76,

    // Assurances (starts at row 80)
    'Assurances/Auto': 80,
    'Assurances/Habitation': 81,
    'Assurances/Assurance vie': 82,
    'Assurances/Assurance scolaire': 83,

    // Divers (starts at row 150)
    'Divers/Frais de banque': 150,
    'Divers/Remboursements prêts': 151,
    'Divers/Cordonnier': 152,
    'Divers/Pressing': 153,
    'Divers/Autre': 154,
};

/**
 * Month index to column letter mapping (B=JAN, C=FEB, etc.)
 */
const MONTH_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

/**
 * Append expense to Google Sheet
 * Adds the amount to the appropriate cell based on category, subcategory, and month
 */
export async function appendExpenseToSheet(
    category: string,
    subcategory: string,
    amount: number,
    date: Date
): Promise<{ success: boolean; error?: string }> {
    try {
        const config = getSheetsConfig();
        if (!config) {
            return { success: false, error: 'Google Sheets not configured' };
        }

        const monthIndex = date.getMonth(); // 0-11
        const column = MONTH_COLUMNS[monthIndex];

        const key = `${category}/${subcategory}`;
        const row = CATEGORY_ROW_MAP[key];

        if (!row) {
            console.log(`No row mapping found for ${key}, skipping Google Sheets sync`);
            return { success: true }; // Not an error, just no mapping
        }

        const cellRange = `Budget!${column}${row}`;

        // First, get current value
        const accessToken = await getAccessToken(config);

        const getResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(cellRange)}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        let currentValue = 0;
        if (getResponse.ok) {
            const getData = await getResponse.json();
            if (getData.values && getData.values[0] && getData.values[0][0]) {
                currentValue = parseFrenchNumber(getData.values[0][0].toString()) || 0;
            }
        }

        // Add new amount to existing value
        const newValue = currentValue + amount;

        // Update the cell
        const updateResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [[newValue]],
                }),
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('Failed to update Google Sheet:', error);
            return { success: false, error };
        }

        console.log(`Updated Google Sheet: ${cellRange} = ${newValue} (was ${currentValue}, added ${amount})`);
        return { success: true };

    } catch (error) {
        console.error('Error appending to Google Sheet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
