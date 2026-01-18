
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Package, DownloadCloud } from 'lucide-react';
import { GlassButton, GlassCard, GlassInput } from '@/components/ui/GlassComponents';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Suggestion {
    name: string;
    selling_price: number;
    unit_cost: number;
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
    const [name, setName] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [initialQuantity, setInitialQuantity] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchSuggestions();
            // Reset fields
            setName('');
            setSellingPrice('');
            setUnitCost('');
            setInitialQuantity('');
            setIsCustomMode(true);
        }
    }, [isOpen]);

    const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
            const res = await fetch('/api/t-wake/products/suggestions');
            const data = await res.json();
            if (data.success) {
                setSuggestions(data.suggestions);
            }
        } catch (e) {
            console.error('Failed to fetch suggestions');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleSuggestionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'custom') {
            setIsCustomMode(true);
            setName('');
            setSellingPrice('');
            setUnitCost('');
        } else {
            const selected = suggestions.find(s => s.name === val);
            if (selected) {
                setIsCustomMode(false);
                setName(selected.name);
                setSellingPrice(selected.selling_price.toString());
                setUnitCost(selected.unit_cost.toString());
            }
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create Product
            const res = await fetch('/api/t-wake/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    selling_price: parseFloat(sellingPrice),
                    unit_cost: parseFloat(unitCost),
                    skipSheetAppend: !isCustomMode // Skip append if imported from sheet
                })
            });

            const result = await res.json();

            if (result.success) {
                // 2. If quantity provided, save sale
                if (initialQuantity && !isNaN(parseFloat(initialQuantity))) {
                    const productId = result.product?.id;
                    if (productId) {
                        try {
                            const now = new Date();
                            // Current month 'YYYY-MM-01'
                            const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

                            await fetch('/api/t-wake/save', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    sales: [{
                                        productId,
                                        month: monthStr,
                                        quantity: parseFloat(initialQuantity)
                                    }]
                                })
                            });
                        } catch (saleErr) {
                            console.error('Failed to save initial quantity', saleErr);
                            // Don't fail the whole flow, user can add manually
                        }
                    }
                }

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

                <div className="mb-6">
                    <label className="text-sm text-white/60 mb-2 block">Importer depuis Google Sheets (Optionnel)</label>
                    <div className="relative">
                        <select
                            onChange={handleSuggestionSelect}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white/80 focus:border-purple-500/50 focus:outline-none appearance-none"
                            defaultValue="custom"
                            disabled={isLoadingSuggestions}
                        >
                            <option value="custom" className="bg-slate-800 text-white">Créer un nouveau produit</option>
                            {suggestions.map((s, i) => (
                                <option key={i} value={s.name} className="bg-slate-800 text-white">
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-2.5 pointer-events-none text-white/40">
                            {isLoadingSuggestions ? '...' : '▼'}
                        </div>
                    </div>
                    {suggestions.length > 0 && (
                        <p className="text-xs text-white/40 mt-1">
                            {suggestions.length} produits trouvés dans le sheet mais pas dans l'app.
                        </p>
                    )}
                </div>

                <div className="w-full h-px bg-white/10 mb-6" />

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-white/60 mb-1 block">Nom du produit</label>
                        <GlassInput
                            value={name}
                            onChange={setName}
                            placeholder="Ex: Cake Citron"
                            required
                            disabled={!isCustomMode}
                        />
                        {!isCustomMode && <p className="text-xs text-white/40 mt-1">Importé du Sheet</p>}
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

                    <div>
                        <label className="text-sm text-white/60 mb-1 block">Quantité vendue (Ce mois) - Optionnel</label>
                        <GlassInput
                            value={initialQuantity}
                            onChange={setInitialQuantity}
                            type="number"
                            placeholder="Ex: 10"
                        />
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
                            {isLoading ? 'Ajout...' : 'Ajouter'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
}
