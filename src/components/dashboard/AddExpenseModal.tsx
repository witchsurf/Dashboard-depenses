'use client';

import { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Tag, FileText, Zap } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../ui/GlassComponents';
import { EXPENSE_CATEGORIES, QUICK_CATEGORIES, saveLocalExpense } from '@/lib/local-storage';
import { formatCurrency } from '@/lib/utils';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExpenseAdded: () => void;
}

export function AddExpenseModal({ isOpen, onClose, onExpenseAdded }: AddExpenseModalProps) {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const selectedCategoryData = EXPENSE_CATEGORIES.find(c => c.name === category);
    const subcategories = selectedCategoryData?.subcategories || [];

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setCategory('');
        setSubcategory('');
        setDescription('');
    };

    const handleQuickAdd = (quickCat: typeof QUICK_CATEGORIES[0]) => {
        setCategory(quickCat.category);
        setSubcategory(quickCat.subcategory);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !category) return;

        setIsSubmitting(true);

        try {
            const numAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));

            if (isNaN(numAmount) || numAmount <= 0) {
                alert('Veuillez entrer un montant valide');
                return;
            }

            // Save locally as backup
            saveLocalExpense({
                date,
                amount: numAmount,
                category,
                subcategory: subcategory || undefined,
                description: description || undefined,
            });

            // Save to Supabase (if configured)
            try {
                const response = await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date,
                        amount: numAmount,
                        category,
                        subcategory: subcategory || null,
                        description: description || null,
                    }),
                });

                if (!response.ok) {
                    console.log('Database save failed, kept in local storage');
                }
            } catch {
                console.log('Sync failed, saved locally');
            }

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                resetForm();
                onExpenseAdded();
            }, 1500);

        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <GlassCard className="w-full max-w-md relative overflow-hidden" hover={false}>
                {/* Success overlay */}
                {showSuccess && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                <span className="text-3xl">✓</span>
                            </div>
                            <p className="text-xl font-semibold text-emerald-300">Dépense ajoutée !</p>
                            <p className="text-emerald-200/70">{formatCurrency(parseFloat(amount.replace(/\s/g, '').replace(',', '.')))}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Nouvelle Dépense</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick categories */}
                <div className="mb-6">
                    <p className="text-sm text-white/60 mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Accès rapide
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_CATEGORIES.map((qc) => (
                            <button
                                key={`${qc.category}-${qc.subcategory}`}
                                type="button"
                                onClick={() => handleQuickAdd(qc)}
                                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${category === qc.category && subcategory === qc.subcategory
                                        ? 'bg-purple-500/40 border border-purple-400/50'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }
                `}
                            >
                                <span className="mr-1">{qc.icon}</span>
                                {qc.subcategory}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="glass-input w-full"
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Montant
                        </label>
                        <div className="relative">
                            <GlassInput
                                type="text"
                                value={amount}
                                onChange={setAmount}
                                placeholder="50000"
                                className="pr-16"
                                aria-label="Montant"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                                CFA
                            </span>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            Catégorie
                        </label>
                        <GlassSelect
                            value={category}
                            onChange={(val) => {
                                setCategory(val);
                                setSubcategory('');
                            }}
                            options={EXPENSE_CATEGORIES.map(c => ({ value: c.name, label: c.name }))}
                            placeholder="Sélectionner..."
                            aria-label="Catégorie"
                        />
                    </div>

                    {/* Subcategory */}
                    {subcategories.length > 0 && (
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Sous-catégorie</label>
                            <GlassSelect
                                value={subcategory}
                                onChange={setSubcategory}
                                options={subcategories.map(s => ({ value: s, label: s }))}
                                placeholder="Sélectionner..."
                                aria-label="Sous-catégorie"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Description (optionnel)
                        </label>
                        <GlassInput
                            value={description}
                            onChange={setDescription}
                            placeholder="Ex: Courses Carrefour"
                            aria-label="Description"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <GlassButton
                            type="button"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Annuler
                        </GlassButton>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={!amount || !category || isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                </>
                            )}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
