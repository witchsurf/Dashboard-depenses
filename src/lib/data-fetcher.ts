import { SheetData, DataSourceConfig } from '@/types';
import { fetchSheetData, fetchSheetTabs, isSheetsConfigured } from './sheets';
import { fetchCSVData, isCSVConfigured } from './csv';
import { getMockTableData } from './mock-data';
import { FRENCH_MONTHS } from './utils';

/**
 * Unified data fetcher that handles all data source modes
 */

export type DataSourceMode = 'api' | 'csv' | 'mock';

/**
 * Determine which data source mode to use
 */
export function getDataSourceMode(): DataSourceMode {
    if (isSheetsConfigured()) return 'api';
    if (isCSVConfigured()) return 'csv';
    return 'mock';
}

/**
 * Get data source configuration status
 */
export async function getDataSourceConfig(): Promise<DataSourceConfig> {
    const mode = getDataSourceMode();

    if (mode === 'api') {
        try {
            const tabs = await fetchSheetTabs();
            return {
                mode: 'api',
                isConnected: true,
                sheetId: process.env.GOOGLE_SHEET_ID,
                availableTabs: tabs,
                selectedTab: tabs[0],
            };
        } catch (error) {
            return {
                mode: 'api',
                isConnected: false,
                sheetId: process.env.GOOGLE_SHEET_ID,
                error: error instanceof Error ? error.message : 'Failed to connect',
            };
        }
    }

    if (mode === 'csv') {
        return {
            mode: 'csv',
            isConnected: true,
            csvUrl: process.env.SHEET_CSV_URL,
        };
    }

    return {
        mode: 'mock',
        isConnected: true,
    };
}

/**
 * Fetch data from the configured source
 */
export async function fetchData(tabName?: string): Promise<SheetData> {
    const mode = getDataSourceMode();

    switch (mode) {
        case 'api':
            return fetchSheetData(tabName);

        case 'csv':
            return fetchCSVData();

        case 'mock':
        default:
            // Convert mock data to SheetData format
            const mockRows = getMockTableData();
            const headers = ['Catégorie', 'Sous-catégorie', ...FRENCH_MONTHS, 'Total', 'Moyenne'];

            return {
                headers,
                rows: mockRows,
                sheetName: 'Mock Data',
                lastUpdated: new Date(),
            };
    }
}

/**
 * Get human-readable status message for data source
 */
export function getDataSourceStatusMessage(config: DataSourceConfig): {
    title: string;
    description: string;
    type: 'success' | 'warning' | 'error' | 'info';
} {
    switch (config.mode) {
        case 'api':
            if (config.isConnected) {
                return {
                    title: 'Google Sheets API',
                    description: `Connecté à ${config.availableTabs?.length || 0} onglet(s)`,
                    type: 'success',
                };
            }
            return {
                title: 'Google Sheets API',
                description: config.error || 'Erreur de connexion',
                type: 'error',
            };

        case 'csv':
            return {
                title: 'Mode CSV',
                description: 'Données chargées depuis URL CSV',
                type: 'info',
            };

        case 'mock':
        default:
            return {
                title: 'Mode Démo',
                description: 'Données de démonstration (configurez une source pour voir vos données)',
                type: 'warning',
            };
    }
}
