
'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, UploadCloud, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { GlassCard, GlassButton } from '@/components/ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';
import { AddProductModal } from './AddProductModal';

interface Product {
    id: string;
    name: string;
    selling_price: number;
    unit_cost: number;
}

interface Sale {
    product_id: string;
    month: string; // YYYY-MM-01
    quantity: number;
}

interface TWakeProps {
    onSync?: () => void;
}

export function TWake({ onSync }: TWakeProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Map<string, Map<number, number>>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);

    // Load data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/t-wake/data');
            const data = await res.json();

            if (data.success) {
                setProducts(data.products);

                // Process sales into Map<ProductId, Map<MonthIndex, Quantity>>
                const newSales = new Map<string, Map<number, number>>();
                data.sales.forEach((s: Sale) => {
                    if (!newSales.has(s.product_id)) {
                        newSales.set(s.product_id, new Map());
                    }
                    const monthIdx = new Date(s.month).getMonth();
                    newSales.get(s.product_id)?.set(monthIdx, Number(s.quantity));
                });
                setSales(newSales);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Erreur de chargement' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleQuantityChange = (productId: string, monthIdx: number, value: string) => {
        const qty = parseFloat(value);
        if (isNaN(qty) && value !== '') return; // Allow empty string for clearing

        setSales(prev => {
            const next = new Map(prev);
            if (!next.has(productId)) {
                next.set(productId, new Map());
            }
            next.get(productId)?.set(monthIdx, isNaN(qty) ? 0 : qty);
            return next;
        });
        setHasUnsavedChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);

        try {
            // Convert Map back to array for API
            const salesPayload: any[] = [];
            sales.forEach((monthMap, productId) => {
                monthMap.forEach((qty, monthIdx) => {
                    salesPayload.push({
                        productId,
                        month: `2026-${String(monthIdx + 1).padStart(2, '0')}-01`,
                        quantity: qty
                    });
                });
            });

            const res = await fetch('/api/t-wake/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sales: salesPayload })
            });
            const result = await res.json();

            if (result.success) {
                setMessage({ type: 'success', text: 'Sauvegardé avec succès' });
                setHasUnsavedChanges(false);
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Erreur de sauvegarde' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncToSheets = async () => {
        if (hasUnsavedChanges) {
            if (!confirm('Vous avez des changements non sauvegardés. Sauvegarder d\'abord ?')) return;
            await handleSave();
        }

        setIsSyncing(true);
        setMessage(null);

        try {
            const res = await fetch('/api/t-wake/sync', { method: 'POST' });
            const result = await res.json();

            if (result.success) {
                setMessage({ type: 'success', text: `Synchronisé vers Google Sheets (${result.updatedRows || 0} lignes)` });
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Erreur de synchronisation' });
        } finally {
            setIsSyncing(false);
        }
    };

    const months = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Calculate totals
    const totals = products.reduce((acc, p) => {
        let qtyTotal = 0;
        const prodSales = sales.get(p.id);
        if (prodSales) {
            prodSales.forEach(q => qtyTotal += q);
        }
        acc.ca += qtyTotal * p.selling_price;
        acc.profit += qtyTotal * (p.selling_price - p.unit_cost);
        return acc;
    }, { ca: 0, profit: 0 });

    return (
        <div className="space-y-6">
            <GlassCard className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Cakes & Biscuits (2026)</h2>
                        <p className="text-white/60 text-sm">Gestion des ventes et synchronisation</p>
                    </div>

                    <div className="flex gap-2">
                        <GlassButton
                            onClick={() => setShowAddProduct(true)}
                            variant="primary"
                            className="mr-2"
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Ajouter</span>
                            </div>
                        </GlassButton>
                        <GlassButton
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            variant="primary"
                        >
                            <div className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {isSaving ? '...' : 'Sauvegarder'}
                            </div>
                        </GlassButton>
                        <GlassButton
                            onClick={handleSyncToSheets}
                            disabled={isSyncing}
                            variant="default"
                        >
                            <div className="flex items-center gap-2">
                                <UploadCloud className="w-4 h-4" />
                                {isSyncing ? 'Sync...' : 'Sync Sheets'}
                            </div>
                        </GlassButton>
                    </div>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${message.type === 'success' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                {/* KPI Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="glass p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                        <p className="text-sm text-emerald-300">Chiffre d'Affaires Annuel</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totals.ca)}</p>
                    </div>
                    <div className="glass p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <p className="text-sm text-purple-300">Bénéfice Annuel</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totals.profit)}</p>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase text-white/60 bg-white/5">
                            <tr>
                                <th className="px-3 py-3 rounded-tl-lg sticky left-0 z-10 glass">Produit</th>
                                <th className="px-3 py-3 text-right">Prix</th>
                                <th className="px-3 py-3 text-right">Marge</th>
                                {months.map(m => (
                                    <th key={m} className="px-2 py-3 text-center min-w-[60px]">{m}</th>
                                ))}
                                <th className="px-3 py-3 text-right rounded-tr-lg">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={16} className="text-center py-8">Chargement...</td></tr>
                            ) : products.map(p => {
                                const annualQty = Array.from(sales.get(p.id)?.values() || []).reduce((a, b) => a + b, 0);
                                const margin = p.selling_price - p.unit_cost;
                                return (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-3 py-2 font-medium sticky left-0 z-10 glass">{p.name}</td>
                                        <td className="px-3 py-2 text-right opacity-70">{formatCurrency(p.selling_price)}</td>
                                        <td className="px-3 py-2 text-right text-emerald-400">{formatCurrency(margin)}</td>

                                        {months.map((_, idx) => {
                                            const qty = sales.get(p.id)?.get(idx) || 0;
                                            return (
                                                <td key={idx} className="px-1 py-1">
                                                    <input
                                                        type="number"
                                                        value={qty || ''}
                                                        onChange={(e) => handleQuantityChange(p.id, idx, e.target.value)}
                                                        className="w-full bg-transparent border-b border-white/10 focus:border-purple-400 text-center text-white focus:outline-none p-1 transition-colors"
                                                        placeholder="-"
                                                    />
                                                </td>
                                            );
                                        })}

                                        <td className="px-3 py-2 text-right font-bold text-white/80">{annualQty}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <AddProductModal
                isOpen={showAddProduct}
                onClose={() => setShowAddProduct(false)}
                onSuccess={() => {
                    loadData();
                    setMessage({ type: 'success', text: 'Produit ajouté avec succès' });
                }}
            />
        </div>
    );
}
