import { BudgetData, BudgetCategory, BudgetItem } from '@/types';
import { FRENCH_MONTHS } from './utils';

/**
 * Mock data for preview when no data source is configured
 * Structure matches the actual Google Sheet format
 */
export const mockBudgetData: BudgetData = {
    months: [...FRENCH_MONTHS],
    revenus: {
        name: 'REVENUS',
        total: [2500000, 850000, 850000, 850000, 850000, 900000, 900000, 900000, 900000, 900000, 900000, 1200000],
        items: [
            {
                name: 'Salaires, pensions...',
                values: [600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000],
                total: 7200000,
                average: 600000,
            },
            {
                name: 'Loyer Chiktay',
                values: [1000000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                total: 1000000,
                average: 83333,
            },
            {
                name: 'T-wake/LP',
                values: [139905, 0, 0, 0, 0, 50000, 50000, 50000, 50000, 50000, 50000, 50000],
                total: 489905,
                average: 40825,
            },
            {
                name: 'Loyer Surf Attitude',
                values: [275000, 250000, 250000, 250000, 250000, 250000, 250000, 250000, 250000, 250000, 250000, 275000],
                total: 3050000,
                average: 254167,
            },
            {
                name: 'Autre',
                values: [147000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 275000],
                total: 422000,
                average: 35167,
            },
        ],
    },
    depenses: [
        {
            name: 'MAISON',
            total: [661310, 500000, 500000, 500000, 500000, 500000, 500000, 500000, 500000, 500000, 500000, 500000],
            items: [
                {
                    name: 'Loyers/emprunt',
                    values: [350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000],
                    total: 4200000,
                    average: 350000,
                },
                {
                    name: 'Électricité/gaz',
                    values: [205100, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000],
                    total: 1085100,
                    average: 90425,
                },
                {
                    name: 'Eau',
                    values: [18210, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000],
                    total: 183210,
                    average: 15268,
                },
                {
                    name: 'Ménage',
                    values: [70000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000],
                    total: 620000,
                    average: 51667,
                },
            ],
        },
        {
            name: 'VIE QUOTIDIENNE',
            total: [254203, 200000, 200000, 200000, 200000, 220000, 220000, 220000, 220000, 220000, 220000, 250000],
            items: [
                {
                    name: 'Courses',
                    values: [233703, 180000, 180000, 180000, 180000, 200000, 200000, 200000, 200000, 200000, 200000, 230000],
                    total: 2383703,
                    average: 198642,
                },
                {
                    name: 'Habillement',
                    values: [5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000],
                    total: 60000,
                    average: 5000,
                },
                {
                    name: 'Divers',
                    values: [15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000, 15000],
                    total: 180000,
                    average: 15000,
                },
            ],
        },
        {
            name: 'ENFANTS',
            total: [385600, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000, 150000],
            items: [
                {
                    name: 'Frais études',
                    values: [362000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000, 120000],
                    total: 1682000,
                    average: 140167,
                },
                {
                    name: 'Argent de poche',
                    values: [4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000],
                    total: 48000,
                    average: 4000,
                },
                {
                    name: 'Jeux/loisirs',
                    values: [3600, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000, 3000],
                    total: 36600,
                    average: 3050,
                },
            ],
        },
        {
            name: 'TRANSPORT',
            total: [40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000],
            items: [
                {
                    name: 'Essence/électricité',
                    values: [40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000, 40000],
                    total: 480000,
                    average: 40000,
                },
            ],
        },
        {
            name: 'ASSURANCES',
            total: [12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750],
            items: [
                {
                    name: 'Auto',
                    values: [12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750, 12750],
                    total: 153000,
                    average: 12750,
                },
            ],
        },
        {
            name: 'ÉPARGNE',
            total: [200000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000],
            items: [
                {
                    name: 'Épargne (Livret, autres...)',
                    values: [200000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000],
                    total: 1300000,
                    average: 108333,
                },
            ],
        },
        {
            name: 'DIVERS',
            total: [550000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000],
            items: [
                {
                    name: 'Remboursements prêts',
                    values: [550000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000, 200000],
                    total: 2750000,
                    average: 229167,
                },
            ],
        },
    ],
    summary: {
        totalRevenus: [2511905, 850000, 850000, 850000, 850000, 900000, 900000, 900000, 900000, 900000, 900000, 1200000],
        totalDepenses: [2103863, 1202750, 1202750, 1202750, 1202750, 1222750, 1222750, 1222750, 1222750, 1222750, 1222750, 1252750],
        net: [408042, -352750, -352750, -352750, -352750, -322750, -322750, -322750, -322750, -322750, -322750, -52750],
        epargne: [200000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000],
    },
};

/**
 * Get summary KPIs from mock data
 */
export function getMockKPIs() {
    const totalRevenus = mockBudgetData.summary.totalRevenus.reduce((a, b) => a + b, 0);
    const totalDepenses = mockBudgetData.summary.totalDepenses.reduce((a, b) => a + b, 0);
    const totalEpargne = mockBudgetData.summary.epargne.reduce((a, b) => a + b, 0);
    const net = totalRevenus - totalDepenses;

    return [
        {
            label: 'Total Revenus',
            value: totalRevenus,
            format: 'currency' as const,
            trend: 'up' as const,
            color: '#10B981',
        },
        {
            label: 'Total Dépenses',
            value: totalDepenses,
            format: 'currency' as const,
            trend: 'down' as const,
            color: '#EF4444',
        },
        {
            label: 'Solde Net',
            value: net,
            format: 'currency' as const,
            trend: net >= 0 ? 'up' as const : 'down' as const,
            color: net >= 0 ? '#10B981' : '#EF4444',
        },
        {
            label: 'Épargne Totale',
            value: totalEpargne,
            format: 'currency' as const,
            trend: 'stable' as const,
            color: '#8B5CF6',
        },
        {
            label: 'Moyenne Revenus/mois',
            value: totalRevenus / 12,
            format: 'currency' as const,
            color: '#06B6D4',
        },
        {
            label: 'Moyenne Dépenses/mois',
            value: totalDepenses / 12,
            format: 'currency' as const,
            color: '#F59E0B',
        },
    ];
}

/**
 * Get time series data for charts
 */
export function getMockTimeSeriesData() {
    return FRENCH_MONTHS.map((month, index) => ({
        name: month,
        revenus: mockBudgetData.summary.totalRevenus[index],
        depenses: mockBudgetData.summary.totalDepenses[index],
        net: mockBudgetData.summary.net[index],
        epargne: mockBudgetData.summary.epargne[index],
    }));
}

/**
 * Get category breakdown for bar chart
 */
export function getMockCategoryData() {
    return mockBudgetData.depenses.map((category) => ({
        name: category.name,
        value: category.total.reduce((a, b) => a + b, 0),
    }));
}

/**
 * Get flat table data for DataTable
 */
export function getMockTableData() {
    const rows: Record<string, string | number>[] = [];

    // Add revenus items
    for (const item of mockBudgetData.revenus.items) {
        const row: Record<string, string | number> = {
            Catégorie: 'REVENUS',
            'Sous-catégorie': item.name,
            Total: item.total,
            Moyenne: item.average,
        };
        FRENCH_MONTHS.forEach((month, i) => {
            row[month] = item.values[i];
        });
        rows.push(row);
    }

    // Add expense items
    for (const category of mockBudgetData.depenses) {
        for (const item of category.items) {
            const row: Record<string, string | number> = {
                Catégorie: category.name,
                'Sous-catégorie': item.name,
                Total: item.total,
                Moyenne: item.average,
            };
            FRENCH_MONTHS.forEach((month, i) => {
                row[month] = item.values[i];
            });
            rows.push(row);
        }
    }

    return rows;
}
