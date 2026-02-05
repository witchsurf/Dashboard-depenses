'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Calendar } from 'lucide-react';
import { GlassButton } from '../ui/GlassComponents';
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

interface CategoryDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    month: Date;
}

export function CategoryDetailModal({
    isOpen,
    onClose,
    category,
    month,
}: CategoryDetailModalProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !category) return;

        const fetchExpenses = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Calculate month range
                const startDate = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
                const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
                    .toISOString().split('T')[0];

                const response = await fetch(
                    `/api/expenses?startDate=${startDate}&endDate=${endDate}&category=${encodeURIComponent(category)}`
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

        fetchExpenses();
    }, [isOpen, category, month]);

    if (!isOpen) return null;

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const monthLabel = month.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div>
                        <h2 className="text-xl font-bold">{category}</h2>
                        <p className="text-sm text-white/60 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span className="capitalize">{monthLabel}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-white/50" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="text-center py-12 text-white/50">
                            <p className="text-4xl mb-4">📭</p>
                            <p>Aucune dépense trouvée pour cette catégorie.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {expense.subcategory && (
                                                <span className="font-medium">
                                                    {expense.subcategory}
                                                </span>
                                            )}
                                            {expense.description && (
                                                <span className="text-sm text-white/60">
                                                    — {expense.description}
                                                </span>
                                            )}
                                            {!expense.subcategory && !expense.description && (
                                                <span className="text-white/50 italic">
                                                    Sans description
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/40 mt-1">
                                            {new Date(expense.date).toLocaleDateString('fr-FR', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-red-400">
                                        {formatCurrency(expense.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {expenses.length > 0 && (
                    <div className="p-4 border-t border-white/10 bg-gradient-to-r from-purple-500/20 to-cyan-500/20">
                        <div className="flex items-center justify-between">
                            <span className="text-white/60">
                                {expenses.length} dépense{expenses.length > 1 ? 's' : ''}
                            </span>
                            <div className="text-right">
                                <p className="text-sm text-white/60">Total</p>
                                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
