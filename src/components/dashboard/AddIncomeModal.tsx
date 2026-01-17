'use client';

import { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Briefcase, FileText } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';

interface AddIncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIncomeAdded: () => void;
}

const INCOME_SOURCES = [
    { value: 'Salaire', label: 'Salaire', icon: '💰' },
    { value: 'Freelance', label: 'Freelance', icon: '💻' },
    { value: 'Investissements', label: 'Investissements', icon: '📈' },
    { value: 'Location', label: 'Location', icon: '🏠' },
    { value: 'Dividendes', label: 'Dividendes', icon: '💵' },
    { value: 'Bonus', label: 'Bonus', icon: '🎁' },
    { value: 'Autres', label: 'Autres revenus', icon: '📦' },
];

export function AddIncomeModal({ isOpen, onClose, onIncomeAdded }: AddIncomeModalProps) {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const resetForm = () => {
        setDate(new Date().toISOString().split('T')[0]);
        setAmount('');
        setSource('');
        setDescription('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !source) return;

        setIsSubmitting(true);

        try {
            const numAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));

            if (isNaN(numAmount) || numAmount <= 0) {
                alert('Veuillez entrer un montant valide');
                return;
            }

            const response = await fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    amount: numAmount,
                    source,
                    description: description || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save income');
            }

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                resetForm();
                onIncomeAdded();
            }, 1500);

        } catch (error) {
            console.error('Error saving income:', error);
            alert('Erreur lors de l\'enregistrement');
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
                            <p className="text-xl font-semibold text-emerald-300">Revenu ajouté !</p>
                            <p className="text-emerald-200/70">{formatCurrency(parseFloat(amount.replace(/\s/g, '').replace(',', '.')))}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Nouveau Revenu</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick source buttons */}
                <div className="mb-6">
                    <p className="text-sm text-white/60 mb-2">Source rapide</p>
                    <div className="flex flex-wrap gap-2">
                        {INCOME_SOURCES.slice(0, 4).map((src) => (
                            <button
                                key={src.value}
                                type="button"
                                onClick={() => setSource(src.value)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-sm transition-all
                                    ${source === src.value
                                        ? 'bg-emerald-500/40 border border-emerald-400/50'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    }
                                `}
                            >
                                <span className="mr-1">{src.icon}</span>
                                {src.label}
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
                                placeholder="500000"
                                className="pr-16"
                                aria-label="Montant"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                                CFA
                            </span>
                        </div>
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            Source
                        </label>
                        <GlassSelect
                            value={source}
                            onChange={setSource}
                            options={INCOME_SOURCES}
                            placeholder="Sélectionner..."
                            aria-label="Source"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Description (optionnel)
                        </label>
                        <GlassInput
                            value={description}
                            onChange={setDescription}
                            placeholder="Ex: Salaire Janvier"
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
                            className="flex-1 !bg-gradient-to-r !from-emerald-500 !to-cyan-500"
                            disabled={!amount || !source || isSubmitting}
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
