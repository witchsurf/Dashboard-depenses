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
    // Maison (rows 24-37 in Google Sheet)
    'Maison/Loyers/emprunt': 25,
    'Maison/Électricité/gaz': 26,
    'Maison/Electricité/gaz': 26, // alias without accent
    'Maison/Essence': 27,
    'Maison/Eau': 28,
    'Maison/Ménage': 29,
    'Maison/Menage': 29, // alias without accent
    'Maison/Téléphones portables': 30,
    'Maison/Internet': 31,
    'Maison/Cable/Satellite': 32,
    'Maison/Réparation/entretien': 33,
    'Maison/Équipements': 34,
    'Maison/Equipements': 34, // alias without accent
    'Maison/Maintenance': 35,
    'Maison/Déco': 36,
    'Maison/Deco': 36, // alias without accent
    'Maison/Autre': 37,

    // Vie Quotidienne (rows 40-47)
    'Vie Quotidienne/Courses': 41,
    'Vie Quotidienne/Argent de poche': 42,
    'Vie Quotidienne/Habillement': 43,
    'Vie Quotidienne/Sorties': 44,
    'Vie Quotidienne/Coiffeur': 45,
    'Vie Quotidienne/Divers': 46,

    // Enfants (rows 49-60)
    'Enfants/Habillement/bijoux': 50,
    'Enfants/Frais études': 51,
    'Enfants/Frais etudes': 51, // alias without accent
    'Enfants/Argent de poche': 52,
    'Enfants/Tél/internet': 53,
    'Enfants/Tel/internet': 53, // alias without accent
    'Enfants/Activités': 54,
    'Enfants/Activites': 54, // alias without accent
    'Enfants/Transports': 55,
    'Enfants/Santé': 56,
    'Enfants/Sante': 56, // alias without accent
    'Enfants/Nounou': 57,
    'Enfants/Jeux/loisirs': 58,
    'Enfants/Divers': 59,

    // Transport (rows 62-69)
    'Transport/Voiture': 63,
    'Transport/Essence/électricité': 64,
    'Transport/Essence/electricite': 64, // alias without accent
    'Transport/Réparations/contrôles': 65,
    'Transport/Reparations/controles': 65, // alias without accent
    'Transport/Transport en commun': 66,
    'Transport/Bus/Taxi': 67,
    'Transport/Divers': 68,

    // Santé (rows 71-77)
    'Santé/Médecins/dentiste': 72,
    'Sante/Medecins/dentiste': 72, // alias without accent
    'Santé/Médicaments/soins': 73,
    'Sante/Medicaments/soins': 73, // alias without accent
    'Santé/Mutuelle': 74,
    'Sante/Mutuelle': 74, // alias without accent
    'Santé/Urgences': 75,
    'Sante/Urgences': 75, // alias without accent
    'Santé/Divers': 76,
    'Sante/Divers': 76, // alias without accent

    // Assurances (rows 79-84)
    'Assurances/Auto': 80,
    'Assurances/Habitation': 81,
    'Assurances/Assurance vie': 82,
    'Assurances/Assurance scolaire': 83,

    // Dons (rows 87-92)
    'Dons/Cadeaux divers': 88,
    'Dons/Organisations': 89,
    'Dons/Communauté religieuse': 90,
    'Dons/Communaute religieuse': 90, // alias without accent
    'Dons/Autre': 91,

    // Épargne (rows 94-101)
    'Épargne/Épargne logement': 95,
    'Epargne/Epargne logement': 95, // alias without accent
    'Épargne/Livret': 96,
    'Epargne/Livret': 96, // alias without accent
    'Épargne/Retraite': 97,
    'Epargne/Retraite': 97, // alias without accent
    'Épargne/Investissements': 98,
    'Epargne/Investissements': 98, // alias without accent
    'Épargne/Projets': 99,
    'Epargne/Projets': 99, // alias without accent
    'Épargne/Divers': 100,
    'Epargne/Divers': 100, // alias without accent

    // Impôts (rows 103-108)
    'Impôts/Impôt sur le revenu': 104,
    'Impots/Impot sur le revenu': 104, // alias without accent
    'Impôts/Taxe habitation/foncière': 105,
    'Impots/Taxe habitation/fonciere': 105, // alias without accent
    'Impôts/Autre': 106,
    'Impots/Autre': 106, // alias without accent

    // Loisirs (rows 110-123)
    'Loisirs/Vidéos/DVDs': 111,
    'Loisirs/Videos/DVDs': 111, // alias without accent
    'Loisirs/Musique': 112,
    'Loisirs/Jeux': 113,
    'Loisirs/Locations': 114,
    'Loisirs/Cinéma': 115,
    'Loisirs/Cinema': 115, // alias without accent
    'Loisirs/Concerts': 116,
    'Loisirs/Livres': 117,
    'Loisirs/Film/Photos': 118,
    'Loisirs/Sports': 119,
    'Loisirs/Sorties': 120,
    'Loisirs/Divers': 121,

    // Animaux (rows 125-130)
    'Animaux/Nourriture/entretien': 126,
    'Animaux/Véto et soins': 127,
    'Animaux/Veto et soins': 127, // alias without accent
    'Animaux/Divers': 128,

    // Abonnements (rows 132-138)
    'Abonnements/Journaux/magazines': 133,
    'Abonnements/Club': 134,
    'Abonnements/Abo 1': 135,
    'Abonnements/Abo 2': 136,
    'Abonnements/Divers': 137,

    // Vacances (rows 140-147)
    'Vacances/Transport': 141,
    'Vacances/Location': 142,
    'Vacances/Repas': 143,
    'Vacances/Location voiture': 144,
    'Vacances/Visites/loisirs': 145,
    'Vacances/Divers': 146,

    // Divers (rows 149-155)
    'Divers/Frais de banque': 150,
    'Divers/Remboursements prêts': 151,
    'Divers/Remboursements prets': 151, // alias without accent
    'Divers/Cordonnier': 152,
    'Divers/Pressing': 153,
    'Divers/Autre': 154,
};

/**
 * Month index to column letter mapping (B=JAN, C=FEB, etc.)
 */
const MONTH_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

/**
 * Sync expense category total to Google Sheet
 * Calculates the TOTAL from Supabase for a category/subcategory/month and writes it
 * Supabase is the source of truth
 */
export async function syncCategoryToSheet(
    category: string,
    subcategory: string,
    month: number, // 0-11
    year: number
): Promise<{ success: boolean; error?: string; total?: number }> {
    try {
        const config = getSheetsConfig();
        if (!config) {
            return { success: false, error: 'Google Sheets not configured' };
        }

        const key = `${category}/${subcategory}`;
        const row = CATEGORY_ROW_MAP[key];

        if (!row) {
            console.log(`No row mapping found for ${key}, skipping Google Sheets sync`);
            return { success: true }; // Not an error, just no mapping
        }

        const column = MONTH_COLUMNS[month];
        const cellRange = `Budget!${column}${row}`;

        // Calculate total from Supabase for this category/subcategory/month
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`;

        // Fetch from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return { success: false, error: 'Supabase not configured' };
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: expenses, error: dbError } = await supabase
            .from('expenses')
            .select('amount')
            .eq('category', category)
            .eq('subcategory', subcategory)
            .gte('date', monthStart)
            .lt('date', nextMonth);

        if (dbError) {
            return { success: false, error: dbError.message };
        }

        // Calculate total
        const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        // Update the cell with the exact total (not adding)
        const accessToken = await getAccessToken(config);

        const updateResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [[total]],
                }),
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.text();
            console.error('Failed to update Google Sheet:', error);
            return { success: false, error };
        }

        console.log(`Synced to Google Sheet: ${cellRange} = ${total} (from ${expenses?.length || 0} expenses)`);
        return { success: true, total };

    } catch (error) {
        console.error('Error syncing to Google Sheet:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Legacy function - now calls syncCategoryToSheet
 */
export async function appendExpenseToSheet(
    category: string,
    subcategory: string,
    amount: number,
    date: Date
): Promise<{ success: boolean; error?: string }> {
    // Use the new sync function that calculates total from Supabase
    return syncCategoryToSheet(
        category,
        subcategory,
        date.getMonth(),
        date.getFullYear()
    );
}

