
'use client';

import { useState } from 'react';
import { X, Plus, Package } from 'lucide-react';
import { GlassButton, GlassCard, GlassInput } from '@/components/ui/GlassComponents';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
    const [name, setName] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/t-wake/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    selling_price: parseFloat(sellingPrice),
                    unit_cost: parseFloat(unitCost)
                })
            });

            const result = await res.json();

            if (result.success) {
                // Reset and close
                setName('');
                setSellingPrice('');
                setUnitCost('');
                onSuccess();
                onClose();
            } else {
                setError(result.error || 'Erreur lors de la création');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <GlassCard className="w-full max-w-md relative" padding="lg">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/60 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold">Nouveau Produit</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-white/60 mb-1 block">Nom du produit</label>
                        <GlassInput
                            value={name}
                            onChange={setName}
                            placeholder="Ex: Cake Citron"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-white/60 mb-1 block">Prix de vente</label>
                            <GlassInput
                                value={sellingPrice}
                                onChange={setSellingPrice}
                                type="number"
                                placeholder="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm text-white/60 mb-1 block">Coût unitaire</label>
                            <GlassInput
                                value={unitCost}
                                onChange={setUnitCost}
                                type="number"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <GlassButton
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Annuler
                        </GlassButton>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Création...' : 'Créer'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
