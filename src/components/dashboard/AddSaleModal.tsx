
'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, ShoppingBag } from 'lucide-react';
import { GlassButton, GlassCard, GlassInput } from '@/components/ui/GlassComponents';

interface AddSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    products: { id: string; name: string }[];
}

export function AddSaleModal({ isOpen, onClose, onSuccess, products }: AddSaleModalProps) {
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setProductId('');
            setQuantity('');
            // Default to today
            const now = new Date();
            setDate(now.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/t-wake/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: parseFloat(quantity),
                    date,
                    description: 'Added manually'
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert('Erreur lors de l\'enregistrement');
            }
        } catch (e) {
            alert('Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md relative" padding="lg">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <ShoppingBag className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold">Nouvelle Vente</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-white/60 mb-1 block">Produit</label>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white focus:border-purple-500/50 focus:outline-none"
                            required
                        >
                            <option value="">Sélectionner un produit</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-white/60 mb-1 block">Quantité</label>
                            <GlassInput
                                type="number"
                                value={quantity}
                                onChange={setQuantity}
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-white/60 mb-1 block">Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:border-purple-500/50 focus:outline-none"
                                    required
                                />
                                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <GlassButton type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Annuler
                        </GlassButton>
                        <GlassButton type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                            {isLoading ? '...' : 'Enregistrer'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
