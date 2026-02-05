'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { GlassCard, GlassButton } from '../ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';

interface Expense {
    id: string;
    date: string;
    amount: number;
    category: string;
    subcategory: string | null;
    description: string | null;
    created_at: string;
}

interface ExpenseHistoryProps {
    onRefresh?: () => void;
}

export function ExpenseHistory({ onRefresh }: ExpenseHistoryProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [error, setError] = useState<string | null>(null);

    const fetchExpenses = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let startDate = selectedDate;
            let endDate = selectedDate;

            if (viewMode === 'week') {
                const date = new Date(selectedDate);
                const dayOfWeek = date.getDay();
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - dayOfWeek);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                startDate = startOfWeek.toISOString().split('T')[0];
                endDate = endOfWeek.toISOString().split('T')[0];
            } else if (viewMode === 'month') {
                const date = new Date(selectedDate);
                startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                endDate = lastDay.toISOString().split('T')[0];
            }

            const response = await fetch(
                `/api/expenses?startDate=${startDate}&endDate=${endDate}`
            );
            const data = await response.json();

            if (data.success) {
                setExpenses(data.data || []);
            } else {
                setError(data.error || 'Erreur de chargement');
            }
        } catch (err) {
            setError('Impossible de charger les dépenses');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [selectedDate, viewMode]);

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette dépense ?')) return;

        try {
            const response = await fetch(`/api/expenses?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setExpenses(prev => prev.filter(e => e.id !== id));
                onRefresh?.();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const date = new Date(selectedDate);
        const offset = direction === 'prev' ? -1 : 1;

        if (viewMode === 'day') {
            date.setDate(date.getDate() + offset);
        } else if (viewMode === 'week') {
            date.setDate(date.getDate() + (offset * 7));
        } else {
            date.setMonth(date.getMonth() + offset);
        }

        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const formatDateLabel = () => {
        const date = new Date(selectedDate);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (viewMode === 'day') {
            if (selectedDate === today.toISOString().split('T')[0]) {
                return "Aujourd'hui";
            } else if (selectedDate === yesterday.toISOString().split('T')[0]) {
                return "Hier";
            }
            return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (viewMode === 'week') {
            return `Semaine du ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
        } else {
            return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        }
    };

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
            acc[expense.category] = { items: [], total: 0 };
        }
        acc[expense.category].items.push(expense);
        acc[expense.category].total += expense.amount;
        return acc;
    }, {} as Record<string, { items: Expense[]; total: number }>);

    return (
        <GlassCard>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Historique</h2>
                </div>

                {/* View mode toggle */}
                <div className="flex gap-1 bg-white/5 rounded-lg p-1 self-start md:self-auto overflow-x-auto max-w-full">
                    {(['day', 'week', 'month'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 rounded text-sm transition-all whitespace-nowrap ${viewMode === mode
                                ? 'bg-purple-500/50 text-white'
                                : 'text-white/60 hover:text-white'
                                }`}
                        >
                            {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white/5 rounded-lg p-3">
                <div className="flex w-full sm:w-auto justify-between sm:justify-start gap-3 order-2 sm:order-1">
                    <button
                        onClick={() => navigateDate('prev')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {/* Mobile Only Date Display (if needed, but centralized text below works well) */}
                </div>

                <div className="text-center order-1 sm:order-2 w-full sm:w-auto">
                    <p className="font-semibold capitalize text-lg sm:text-base">{formatDateLabel()}</p>
                    <p className="text-sm text-white/60">{expenses.length} dépense(s)</p>
                </div>

                <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-2 order-3">
                    <button
                        onClick={goToToday}
                        className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors whitespace-nowrap"
                    >
                        Aujourd&apos;hui
                    </button>
                    <button
                        onClick={() => navigateDate('next')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-white/50" />
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <p className="text-red-400 mb-4">{error}</p>
                    <GlassButton onClick={fetchExpenses}>Réessayer</GlassButton>
                </div>
            ) : expenses.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                    <p className="text-4xl mb-4">📭</p>
                    <p>Aucune dépense trouvée pour cette période.</p>
                </div>
            ) : (
                <>
                    {/* Total */}
                    <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-white/60">Total</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                    </div>

                    {/* Expenses by category */}
                    <div className="space-y-4">
                        {Object.entries(expensesByCategory).map(([category, { items, total }]) => (
                            <div key={category} className="bg-white/5 rounded-lg overflow-hidden">
                                {/* Category header */}
                                <div className="flex items-center justify-between p-3 bg-white/5">
                                    <span className="font-semibold">{category}</span>
                                    <span className="text-purple-300">{formatCurrency(total)}</span>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-white/5">
                                    {items.map((expense) => (
                                        <div
                                            key={expense.id}
                                            className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group gap-3"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {expense.subcategory && (
                                                        <span className="text-sm text-white/70 truncate max-w-full">
                                                            {expense.subcategory}
                                                        </span>
                                                    )}
                                                    {expense.description && (
                                                        <span className="text-xs text-white/50 truncate max-w-full hidden sm:inline">
                                                            — {expense.description}
                                                        </span>
                                                    )}
                                                    {/* Mobile Description on new line */}
                                                    {expense.description && (
                                                        <div className="text-xs text-white/50 truncate w-full sm:hidden">
                                                            {expense.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/40 mt-1">
                                                    {new Date(expense.created_at).toLocaleTimeString('fr-FR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="font-medium whitespace-nowrap">
                                                    {formatCurrency(expense.amount)}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </GlassCard>
    );
}
