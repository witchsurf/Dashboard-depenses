'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Sidebar, type NavSection } from '@/components/layout';
import {
    KPICards,
    TimeSeriesChart,
    CategoryBarChart,
    DonutChart,
    AddExpenseModal,
    AddIncomeModal,
    ExpenseHistory
} from '@/components/dashboard';
import { GlassButton, GlassCard } from '@/components/ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';

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

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/dashboard');
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
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        loadData();
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
                <header className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                            Dashboard Dépenses
                        </h1>
                        <p className="text-sm text-white/60 mt-1">
                            {data?.config.statusMessage || 'Chargement...'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
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
                                                height={250}
                                            />
                                        </GlassCard>
                                    )}
                                </div>

                                {/* Recent transactions */}
                                {data.recentTransactions.length > 0 && (
                                    <GlassCard>
                                        <h3 className="text-lg font-semibold mb-4">Dernières dépenses</h3>
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
                                                    <p className="font-semibold text-red-400">
                                                        -{formatCurrency(tx.amount)}
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

                        {/* Charts Section */}
                        {activeSection === 'charts' && data && (
                            <div className="space-y-6">
                                <GlassCard>
                                    <TimeSeriesChart
                                        data={data.timeSeriesData}
                                        title="Revenus vs Dépenses"
                                        height={350}
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
