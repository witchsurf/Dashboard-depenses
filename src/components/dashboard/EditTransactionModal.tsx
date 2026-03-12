'use client';

import { useState, useEffect } from 'react';
import { X, Save, Calendar, DollarSign, Tag, FileText, ShoppingBag } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../ui/GlassComponents';
import { EXPENSE_CATEGORIES } from '@/lib/local-storage';
import { formatCurrency } from '@/lib/utils';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    transaction: any; // Type depends on the transaction being edited
}

export function EditTransactionModal({ isOpen, onClose, onUpdated, transaction }: EditTransactionModalProps) {
    const [date, setDate] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (transaction) {
            setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
            setAmount(String(transaction.amount || ''));

            if (transaction.type === 'expense') {
                setCategory(transaction.category || '');
                setSubcategory(transaction.subcategory || '');
            } else if (transaction.type === 'income') {
                setCategory(transaction.category || ''); // In UI 'source' is mapped to 'category'
            } else if (transaction.category === 'Vente T-WAKE') {
                // For T-Wake, description often contains "(xN)" - needs careful handling
                // But better to just edit description/date for now if API isn't fully ready for full T-Wake edit
            }

            setDescription(transaction.description || '');
        }
    }, [transaction]);

    const isTWake = transaction?.category === 'Vente T-WAKE';
    const isIncome = transaction?.type === 'income' && !isTWake;
    const isExpense = transaction?.type === 'expense';

    const selectedCategoryData = EXPENSE_CATEGORIES.find(c => c.name === category);
    const subcategories = selectedCategoryData?.subcategories || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction) return;

        setIsSubmitting(true);
        try {
            const numAmount = parseFloat(String(amount).replace(/\s/g, '').replace(',', '.'));

            let endpoint = '/api/expenses';
            let body: any = { id: transaction.id, date, amount: numAmount, description };

            if (isExpense) {
                endpoint = '/api/expenses';
                body = { ...body, category, subcategory: subcategory || null };
            } else if (isIncome) {
                endpoint = '/api/income';
                body = { ...body, source: category };
            } else if (isTWake) {
                endpoint = '/api/t-wake/transactions';
                // T-Wake edit logic might be more complex if we need to change product_id or quantity
                // For now, let's just allow date and description update if it's simpler
                body = { id: transaction.id, date, description };
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onUpdated();
                }, 1000);
            } else {
                const err = await response.json();
                alert(`Erreur: ${err.error || 'Inconnue'}`);
            }
        } catch (err) {
            console.error('Update failed:', err);
            alert('Erreur lors de la mise à jour');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <GlassCard className="w-full max-w-md relative overflow-hidden" hover={false}>
                {showSuccess && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                        <p className="text-xl font-semibold text-emerald-300">Modifié avec succès !</p>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                            <Save className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Modifier Transaction</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="glass-input w-full"
                            required
                        />
                    </div>

                    {/* Amount - Hidden or restricted for T-Wake since it depends on product/quantity */}
                    {!isTWake && (
                        <div>
                            <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Montant
                            </label>
                            <GlassInput
                                type="text"
                                value={amount}
                                onChange={setAmount}
                                placeholder="Montant"
                                aria-label="Montant"
                            />
                        </div>
                    )}

                    {/* Category / Source */}
                    {!isTWake && (
                        <div>
                            <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {isIncome ? 'Source' : 'Catégorie'}
                            </label>
                            {isExpense ? (
                                <GlassSelect
                                    value={category}
                                    onChange={(val) => {
                                        setCategory(val);
                                        setSubcategory('');
                                    }}
                                    options={EXPENSE_CATEGORIES.map(c => ({ value: c.name, label: c.name }))}
                                    placeholder="Sélectionner..."
                                />
                            ) : (
                                <GlassInput
                                    value={category}
                                    onChange={setCategory}
                                    placeholder="Source de revenu"
                                />
                            )}
                        </div>
                    )}

                    {/* Subcategory */}
                    {isExpense && subcategories.length > 0 && (
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Sous-catégorie</label>
                            <GlassSelect
                                value={subcategory}
                                onChange={setSubcategory}
                                options={subcategories.map(s => ({ value: s, label: s }))}
                                placeholder="Sélectionner..."
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Description
                        </label>
                        <GlassInput
                            value={description}
                            onChange={setDescription}
                            placeholder="Description..."
                            aria-label="Description"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <GlassButton type="button" onClick={onClose} className="flex-1">Annuler</GlassButton>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '...' : 'Enregistrer'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
