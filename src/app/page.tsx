'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Sidebar, type NavSection } from '@/components/layout';
import {
    KPICards,
    TimeSeriesChart,
    CategoryBarChart,
    DonutChart,
    AddExpenseModal,
    AddIncomeModal,
    ExpenseHistory,
    TWake,
    DataTable,
    Filters
} from '@/components/dashboard';
import { GlassButton, GlassCard } from '@/components/ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardData {
    kpis: Array<{
        label: string;
        value: number;
        format: 'currency' | 'number' | 'percentage';
        trend: 'up' | 'down' | 'stable';
        color: string;
    }>;
    categoryData: Array<{ name: string; value: number }>;
    timeSeriesData: Array<{ name: string; depenses: number; revenus: number }>;
    recentTransactions: Array<{
        id: string;
        date: string;
        amount: number;
        category: string;
        description?: string;
        type?: 'income' | 'expense';
    }>;
    config: {
        mode: string;
        isConnected: boolean;
        statusMessage: string;
        lastUpdated: string;
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<NavSection>('home');
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddIncome, setShowAddIncome] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Format date as YYYY-MM for API
            const monthStr = format(selectedMonth, 'yyyy-MM');

            // Add timestamp to prevent browser caching
            const response = await fetch(`/api/dashboard?t=${Date.now()}&month=${monthStr}`);
            const result = await response.json();

            if (result.success) {
                setData(result);
            } else {
                setError(result.error || 'Erreur de chargement');
            }
        } catch (err) {
            setError('Impossible de charger les données');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
    };

    const handlePrevMonth = () => {
        setSelectedMonth(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setSelectedMonth(prev => addMonths(prev, 1));
    };

    return (
        <main className="min-h-screen flex">
            {/* Sidebar */}
            <Sidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
            />

            {/* Main content */}
            <div className="flex-1 ml-16 md:ml-20 p-4 md:p-8">
                {/* Header */}
                <header className="glass rounded-2xl p-4 mb-6 flex flex-col xl:flex-row items-center justify-between gap-4">
                    <div className="flex items-center justify-between w-full xl:w-auto gap-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                Dashboard Dépenses
                            </h1>
                            <p className="text-sm text-white/60 mt-1">
                                {data?.config.statusMessage || 'Chargement...'}
                            </p>
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="font-medium capitalize">
                                {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                            </span>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                        {/* Add Income Button */}
                        <GlassButton
                            onClick={() => setShowAddIncome(true)}
                            className="!bg-gradient-to-r !from-emerald-500/20 !to-cyan-500/20 !border-emerald-500/30"
                        >
                            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                            <span className="hidden sm:inline">Revenu</span>
                        </GlassButton>

                        {/* Add Expense Button */}
                        <GlassButton
                            onClick={() => setShowAddExpense(true)}
                            variant="primary"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="hidden sm:inline">Dépense</span>
                        </GlassButton>

                        {/* Refresh Button */}
                        <GlassButton
                            onClick={handleRefresh}
                            variant="ghost"
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </GlassButton>
                    </div>
                </header>

                {/* Content based on active section */}
                {isLoading && !data ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                ) : error ? (
                    <GlassCard className="text-center py-12">
                        <p className="text-red-400 mb-4">{error}</p>
                        <GlassButton onClick={handleRefresh}>Réessayer</GlassButton>
                    </GlassCard>
                ) : (
                    <>
                        {/* Home Section */}
                        {activeSection === 'home' && data && (
                            <div className="space-y-6">
                                {/* KPIs */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {data.kpis.map((kpi, index) => (
                                        <GlassCard key={index} className="relative overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 right-0 h-1"
                                                style={{ backgroundColor: kpi.color }}
                                            />
                                            <p className="text-sm text-white/60 mb-1">{kpi.label}</p>
                                            <p className="text-2xl font-bold">
                                                {kpi.format === 'currency'
                                                    ? formatCurrency(kpi.value)
                                                    : kpi.value.toLocaleString('fr-FR')}
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                {kpi.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                                                {kpi.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                                                {kpi.trend === 'stable' && <Wallet className="w-4 h-4 text-white/40" />}
                                            </div>
                                        </GlassCard>
                                    ))}
                                </div>

                                {/* Charts */}
                                <div className="grid lg:grid-cols-2 gap-6">
                                    {data.categoryData.length > 0 && (
                                        <GlassCard>
                                            <h3 className="text-lg font-semibold mb-4">Dépenses par catégorie</h3>
                                            <DonutChart
                                                data={data.categoryData}
                                                title=""
                                            />
                                        </GlassCard>
                                    )}

                                    {data.timeSeriesData.length > 0 && (
                                        <GlassCard>
                                            <h3 className="text-lg font-semibold mb-4">Évolution mensuelle</h3>
                                            <TimeSeriesChart
                                                data={data.timeSeriesData}
                                                title=""
                                            />
                                        </GlassCard>
                                    )}
                                </div>

                                {/* Recent transactions */}
                                {data.recentTransactions.length > 0 && (
                                    <GlassCard>
                                        <h3 className="text-lg font-semibold mb-4">Dernières transactions</h3>
                                        <div className="space-y-2">
                                            {data.recentTransactions.slice(0, 5).map((tx) => (
                                                <div
                                                    key={tx.id}
                                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                                                >
                                                    <div>
                                                        <p className="font-medium">{tx.category}</p>
                                                        <p className="text-sm text-white/50">
                                                            {new Date(tx.date).toLocaleDateString('fr-FR')}
                                                            {tx.description && ` — ${tx.description}`}
                                                        </p>
                                                    </div>
                                                    <p className={`font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                )}
                            </div>
                        )}

                        {/* History Section */}
                        {activeSection === 'history' && (
                            <ExpenseHistory onRefresh={handleRefresh} />
                        )}

                        {/* T-WAKE Section */}
                        {activeSection === 't-wake' && (
                            <TWake />
                        )}

                        {/* Charts Section */}
                        {activeSection === 'charts' && data && (
                            <div className="space-y-6">
                                <GlassCard>
                                    <TimeSeriesChart
                                        data={data.timeSeriesData}
                                        title="Revenus vs Dépenses"
                                    />
                                </GlassCard>
                                <div className="grid lg:grid-cols-2 gap-6">
                                    <GlassCard>
                                        <CategoryBarChart
                                            data={data.categoryData}
                                            title="Dépenses par catégorie"
                                        />
                                    </GlassCard>
                                    <GlassCard>
                                        <DonutChart
                                            data={data.categoryData}
                                            title="Répartition"
                                        />
                                    </GlassCard>
                                </div>
                            </div>
                        )}

                        {/* Table Section */}
                        {activeSection === 'table' && data && (
                            <DataTable
                                title="Transactions du mois"
                                data={data.recentTransactions.map(t => ({
                                    ...t,
                                    date: new Date(t.date).toLocaleDateString('fr-FR'),
                                    amount: t.amount // Keep number for sorting, format handles display
                                }))}
                                columns={[
                                    { key: 'date', label: 'Date', sortable: true },
                                    { key: 'category', label: 'Catégorie', sortable: true },
                                    { key: 'description', label: 'Description', sortable: true },
                                    { key: 'amount', label: 'Montant', sortable: true, format: 'currency', align: 'right' },
                                    { key: 'type', label: 'Type', sortable: true }
                                ]}
                            />
                        )}

                        {/* Filters Section */}
                        {activeSection === 'filters' && (
                            <Filters />
                        )}

                        {/* Settings Section */}
                        {activeSection === 'settings' && (
                            <GlassCard>
                                <h2 className="text-xl font-bold mb-6">Paramètres</h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="font-medium">Source de données</p>
                                        <p className="text-sm text-white/60">Supabase (PostgreSQL)</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="font-medium">Statut</p>
                                        <p className="text-sm text-emerald-400">✓ Connecté</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-lg">
                                        <p className="font-medium">Dernière mise à jour</p>
                                        <p className="text-sm text-white/60">
                                            {data?.config.lastUpdated
                                                ? new Date(data.config.lastUpdated).toLocaleString('fr-FR')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <AddExpenseModal
                isOpen={showAddExpense}
                onClose={() => setShowAddExpense(false)}
                onExpenseAdded={() => {
                    setShowAddExpense(false);
                    loadData();
                }}
            />
            <AddIncomeModal
                isOpen={showAddIncome}
                onClose={() => setShowAddIncome(false)}
                onIncomeAdded={() => {
                    setShowAddIncome(false);
                    loadData();
                }}
            />
        </main>
    );
}
