'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Sidebar, type NavSection } from '@/components/layout';
import {
    KPICards,
    TimeSeriesChart,
    CategoryBarChart,
    DonutChart,
    DataTable,
    Filters,
    ConfigWizard,
    AddExpenseModal,
    ExpenseHistory
} from '@/components/dashboard';
import { GlassButton, GlassCard, Badge } from '@/components/ui/GlassComponents';
import { DashboardSkeleton, ErrorState } from '@/components/ui';
import { DataSourceConfig, FilterState, KPIData, ColumnSchema } from '@/types';
import {
    getMockKPIs,
    getMockTimeSeriesData,
    getMockCategoryData,
    getMockTableData
} from '@/lib/mock-data';
import { FRENCH_MONTHS } from '@/lib/utils';
import { getLocalExpenses } from '@/lib/local-storage';

interface DashboardData {
    config: DataSourceConfig;
    kpis: KPIData[];
    timeSeriesData: { name: string; revenus: number; depenses: number; epargne?: number }[];
    categoryData: { name: string; value: number }[];
    tableData: Record<string, string | number>[];
    tableColumns: { key: string; label: string; format?: 'currency' | 'number' | 'text' }[];
    categories: string[];
    schemas: ColumnSchema[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>('');
    const [showConfigWizard, setShowConfigWizard] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [localExpenseCount, setLocalExpenseCount] = useState(0);
    const [activeSection, setActiveSection] = useState<NavSection>('home');
    const [filters, setFilters] = useState<FilterState>({
        dateRange: { start: null, end: null },
        categories: [],
        searchQuery: '',
    });

    useEffect(() => {
        const expenses = getLocalExpenses();
        setLocalExpenseCount(expenses.length);
    }, [showAddExpense]);

    const loadData = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setIsLoading(true);
            setIsRefreshing(!showLoader);
            setError(null);

            const response = await fetch(`/api/sheets${selectedTab ? `?tab=${encodeURIComponent(selectedTab)}` : ''}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            if (result.mode === 'mock') {
                const tableData = getMockTableData();
                const tableColumns = [
                    { key: 'Catégorie', label: 'Catégorie', format: 'text' as const },
                    { key: 'Sous-catégorie', label: 'Sous-catégorie', format: 'text' as const },
                    ...FRENCH_MONTHS.map(m => ({ key: m, label: m, format: 'currency' as const })),
                    { key: 'Total', label: 'Total', format: 'currency' as const },
                    { key: 'Moyenne', label: 'Moyenne', format: 'currency' as const },
                ];

                const categories = Array.from(new Set(tableData.map(row => String(row['Catégorie']))));

                setData({
                    config: result.config,
                    kpis: getMockKPIs(),
                    timeSeriesData: getMockTimeSeriesData(),
                    categoryData: getMockCategoryData(),
                    tableData,
                    tableColumns,
                    categories,
                    schemas: result.schema || [],
                });
                setShowConfigWizard(true);
            } else {
                const sheetData = result.data;
                const headers = sheetData.headers;

                const tableColumns = headers.map((h: string) => ({
                    key: h,
                    label: h,
                    format: result.budgetStructure.monthColumns.includes(h) ? 'currency' : 'text',
                }));

                const categoryColumn = result.budgetStructure.categoryColumn as string;
                const categoriesRaw = categoryColumn
                    ? Array.from(new Set(sheetData.rows.map((row: Record<string, unknown>) => String(row[categoryColumn] || ''))))
                    : [];
                const categories: string[] = (categoriesRaw as string[]).filter(c => c && c.trim() !== '');

                const kpis = generateKPIsFromData(sheetData.rows, result.budgetStructure);
                const timeSeriesData = generateTimeSeriesFromData(sheetData.rows, result.budgetStructure);
                const categoryData = generateCategoryDataFromData(sheetData.rows, result.budgetStructure);

                setData({
                    config: result.config,
                    kpis,
                    timeSeriesData,
                    categoryData,
                    tableData: sheetData.rows,
                    tableColumns,
                    categories,
                    schemas: result.schema || [],
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData(false);
    };

    const filteredTableData = data?.tableData.filter(row => {
        if (filters.categories.length > 0) {
            const category = String(row['Catégorie'] || '');
            if (!filters.categories.includes(category)) {
                return false;
            }
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const match = Object.values(row).some(v =>
                String(v).toLowerCase().includes(query)
            );
            if (!match) return false;
        }

        return true;
    }) || [];

    if (isLoading) {
        return (
            <div className="min-h-screen flex">
                <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
                <main className="flex-1 md:ml-20 p-4 md:p-6">
                    <DashboardSkeleton />
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex">
                <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
                <main className="flex-1 md:ml-20 p-4 md:p-6">
                    <ErrorState error={error} onRetry={handleRefresh} showConfigHelp={true} />
                </main>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen flex">
            <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

            {/* Main content */}
            <main className="flex-1 md:ml-20 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="ml-12 md:ml-0">
                        <h1 className="text-2xl font-bold">Dashboard Dépenses</h1>
                        <p className="text-white/60 text-sm">Budget Familial</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={data.config.mode === 'csv' ? 'info' : data.config.mode === 'api' ? 'success' : 'warning'}>
                            {data.config.mode === 'csv' ? 'CSV' : data.config.mode === 'api' ? 'API' : 'Démo'}
                        </Badge>
                        <GlassButton
                            onClick={() => setShowAddExpense(true)}
                            variant="primary"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nouvelle Dépense</span>
                        </GlassButton>
                        <GlassButton onClick={handleRefresh} disabled={isRefreshing}>
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </GlassButton>
                    </div>
                </div>

                {/* Add Expense Modal */}
                <AddExpenseModal
                    isOpen={showAddExpense}
                    onClose={() => setShowAddExpense(false)}
                    onExpenseAdded={() => {
                        setShowAddExpense(false);
                        loadData(false);
                    }}
                />

                {/* Config Wizard */}
                {showConfigWizard && data.config.mode === 'mock' && (
                    <ConfigWizard onClose={() => setShowConfigWizard(false)} />
                )}

                {/* Content based on active section */}
                {activeSection === 'home' && (
                    <div className="space-y-6">
                        {/* KPI Cards only on home */}
                        <section aria-label="Indicateurs clés">
                            <KPICards kpis={data.kpis} />
                        </section>

                        {/* Quick summary chart */}
                        <section>
                            <GlassCard>
                                <h2 className="text-lg font-semibold mb-4">Évolution Mensuelle</h2>
                                <div className="h-64">
                                    <TimeSeriesChart
                                        data={data.timeSeriesData}
                                        showEpargne={false}
                                    />
                                </div>
                            </GlassCard>
                        </section>
                    </div>
                )}

                {activeSection === 'charts' && (
                    <div className="space-y-6">
                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TimeSeriesChart
                                data={data.timeSeriesData}
                                title="Évolution Revenus vs Dépenses"
                                showEpargne={true}
                            />
                            <CategoryBarChart
                                data={data.categoryData}
                                title="Dépenses par Catégorie"
                            />
                        </section>
                        <section>
                            <DonutChart
                                data={data.categoryData}
                                title="Distribution des Dépenses"
                            />
                        </section>
                    </div>
                )}

                {activeSection === 'table' && (
                    <section>
                        <DataTable
                            data={filteredTableData}
                            columns={data.tableColumns}
                            title="Détail des Transactions"
                            pageSize={15}
                            exportFilename="budget-export"
                        />
                    </section>
                )}

                {activeSection === 'filters' && (
                    <section>
                        <Filters
                            categories={data.categories}
                            filters={filters}
                            onFiltersChange={setFilters}
                        />
                    </section>
                )}

                {activeSection === 'history' && (
                    <section>
                        <ExpenseHistory onRefresh={() => loadData(false)} />
                    </section>
                )}

                {activeSection === 'settings' && (
                    <section className="space-y-6">
                        <GlassCard>
                            <h2 className="text-xl font-bold mb-4">⚙️ Paramètres</h2>

                            <div className="space-y-6">
                                {/* Data Source Info */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Source de données</h3>
                                    <div className="space-y-2 text-white/70">
                                        <p><strong>Mode actuel :</strong> {data.config.mode === 'api' ? 'Google Sheets API' : data.config.mode === 'csv' ? 'CSV' : 'Démo'}</p>
                                        <p><strong>Statut :</strong> {data.config.statusMessage}</p>
                                        {data.config.lastUpdated && (
                                            <p><strong>Dernière mise à jour :</strong> {new Date(data.config.lastUpdated).toLocaleString('fr-FR')}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Local Expenses */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Dépenses locales</h3>
                                    <div className="space-y-2 text-white/70">
                                        <p><strong>Nombre :</strong> {localExpenseCount} dépense(s) enregistrée(s)</p>
                                        {localExpenseCount > 0 && (
                                            <GlassButton
                                                onClick={() => {
                                                    if (confirm('Supprimer toutes les dépenses locales ?')) {
                                                        localStorage.removeItem('dashboard_expenses');
                                                        setLocalExpenseCount(0);
                                                    }
                                                }}
                                                className="mt-2"
                                            >
                                                🗑️ Effacer les dépenses locales
                                            </GlassButton>
                                        )}
                                    </div>
                                </div>

                                {/* Configuration Help */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Configuration</h3>
                                    <div className="bg-white/5 rounded-lg p-4 text-sm text-white/70">
                                        <p className="mb-2">Pour connecter votre Google Sheet, créez un fichier <code className="bg-white/10 px-1 rounded">.env.local</code> avec :</p>
                                        <pre className="bg-black/30 p-3 rounded overflow-x-auto">
                                            {`# Option 1: CSV (simple)
SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/VOTRE_ID/export?format=csv

# Option 2: API (avancé)
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="..."
GOOGLE_SHEET_ID=...`}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </section>
                )}
            </main>
        </div>
    );
}

// Helper functions
function generateKPIsFromData(rows: Record<string, unknown>[], budgetStructure: { monthColumns: string[] }): KPIData[] {
    const { monthColumns } = budgetStructure;

    const totalRevenusRow = rows.find(r =>
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total revenus')
    );
    const totalDepensesRow = rows.find(r =>
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total dépenses') ||
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total depenses')
    );

    const calculateTotal = (row: Record<string, unknown> | undefined) => {
        if (!row) return 0;
        return monthColumns.reduce((sum: number, month: string) => {
            const val = row[month];
            return sum + (typeof val === 'number' ? val : 0);
        }, 0);
    };

    const totalRevenus = calculateTotal(totalRevenusRow);
    const totalDepenses = calculateTotal(totalDepensesRow);
    const net = totalRevenus - totalDepenses;

    return [
        { label: 'Total Revenus', value: totalRevenus, format: 'currency', trend: 'up', color: '#10B981' },
        { label: 'Total Dépenses', value: totalDepenses, format: 'currency', trend: 'down', color: '#EF4444' },
        { label: 'Solde Net', value: net, format: 'currency', trend: net >= 0 ? 'up' : 'down', color: net >= 0 ? '#10B981' : '#EF4444' },
        { label: 'Moyenne/Mois', value: totalDepenses / 12, format: 'currency', color: '#F59E0B' },
    ];
}

function generateTimeSeriesFromData(rows: Record<string, unknown>[], budgetStructure: { monthColumns: string[] }) {
    const { monthColumns } = budgetStructure;

    const totalRevenusRow = rows.find(r =>
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total revenus')
    );
    const totalDepensesRow = rows.find(r =>
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total dépenses') ||
        String(r[Object.keys(r)[0]] || '').toLowerCase().includes('total depenses')
    );

    return monthColumns.map((month: string) => ({
        name: month,
        revenus: typeof totalRevenusRow?.[month] === 'number' ? totalRevenusRow[month] as number : 0,
        depenses: typeof totalDepensesRow?.[month] === 'number' ? totalDepensesRow[month] as number : 0,
    }));
}

function generateCategoryDataFromData(rows: Record<string, unknown>[], budgetStructure: { monthColumns: string[]; categoryColumn: string }) {
    const { monthColumns, categoryColumn } = budgetStructure;
    const categories: { name: string; value: number }[] = [];

    rows.forEach(row => {
        const catName = String(row[categoryColumn] || '');
        if (catName.startsWith('Total ') && !catName.toLowerCase().includes('revenus')) {
            const value = monthColumns.reduce((sum: number, month: string) => {
                const val = row[month];
                return sum + (typeof val === 'number' ? val : 0);
            }, 0);
            if (value > 0) {
                categories.push({ name: catName.replace('Total ', ''), value });
            }
        }
    });

    return categories;
}
