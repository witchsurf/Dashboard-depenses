'use client';

import { useState } from 'react';
import { RefreshCw, Menu, X, Database, FileSpreadsheet, Cloud, AlertTriangle, Plus } from 'lucide-react';
import { GlassButton, GlassSelect, Badge } from '../ui/GlassComponents';
import { DataSourceConfig } from '@/types';

interface TopbarProps {
    config: DataSourceConfig;
    selectedTab?: string;
    onTabChange?: (tab: string) => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    onAddExpense?: () => void;
    localExpenseCount?: number;
}

export function Topbar({
    config,
    selectedTab,
    onTabChange,
    onRefresh,
    isRefreshing = false,
    onAddExpense,
    localExpenseCount = 0
}: TopbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getStatusBadge = () => {
        switch (config.mode) {
            case 'api':
                if (config.isConnected) {
                    return (
                        <Badge variant="success">
                            <Cloud className="w-3 h-3" />
                            Google Sheets API
                        </Badge>
                    );
                }
                return (
                    <Badge variant="error">
                        <AlertTriangle className="w-3 h-3" />
                        Erreur API
                    </Badge>
                );
            case 'csv':
                return (
                    <Badge variant="info">
                        <FileSpreadsheet className="w-3 h-3" />
                        Mode CSV
                    </Badge>
                );
            case 'mock':
            default:
                return (
                    <Badge variant="warning">
                        <Database className="w-3 h-3" />
                        Mode Démo
                    </Badge>
                );
        }
    };

    return (
        <header className="glass sticky top-0 z-50 mb-6">
            <div className="px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between">
                    {/* Logo / Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-xl font-bold">💰</span>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg md:text-xl font-bold">Dashboard Dépenses</h1>
                            <p className="text-xs text-white/60">Budget Familial</p>
                        </div>
                    </div>

                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Status Badge */}
                        {getStatusBadge()}

                        {/* Add Expense Button - PROMINENT */}
                        {onAddExpense && (
                            <GlassButton
                                onClick={onAddExpense}
                                variant="primary"
                                className="relative"
                                aria-label="Ajouter une dépense"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nouvelle Dépense</span>
                                {localExpenseCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-cyan-500 text-xs flex items-center justify-center">
                                        {localExpenseCount}
                                    </span>
                                )}
                            </GlassButton>
                        )}

                        {/* Tab Selector */}
                        {config.availableTabs && config.availableTabs.length > 0 && (
                            <GlassSelect
                                value={selectedTab || ''}
                                onChange={(value) => onTabChange?.(value)}
                                options={config.availableTabs.map(tab => ({ value: tab, label: tab }))}
                                aria-label="Sélectionner un onglet"
                                className="w-40"
                            />
                        )}

                        {/* Refresh Button */}
                        <GlassButton
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            aria-label="Rafraîchir les données"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden lg:inline">Rafraîchir</span>
                        </GlassButton>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex md:hidden items-center gap-2">
                        {getStatusBadge()}
                        <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </GlassButton>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="mt-4 pt-4 border-t border-white/10 md:hidden animate-slide-up">
                        <div className="space-y-3">
                            {config.availableTabs && config.availableTabs.length > 0 && (
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">Onglet</label>
                                    <GlassSelect
                                        value={selectedTab || ''}
                                        onChange={(value) => {
                                            onTabChange?.(value);
                                            setMobileMenuOpen(false);
                                        }}
                                        options={config.availableTabs.map(tab => ({ value: tab, label: tab }))}
                                        aria-label="Sélectionner un onglet"
                                        className="w-full"
                                    />
                                </div>
                            )}
                            {/* Add Expense - Mobile */}
                            {onAddExpense && (
                                <GlassButton
                                    onClick={() => {
                                        onAddExpense();
                                        setMobileMenuOpen(false);
                                    }}
                                    variant="primary"
                                    className="w-full justify-center"
                                >
                                    <Plus className="w-4 h-4" />
                                    Nouvelle Dépense
                                </GlassButton>
                            )}
                            <GlassButton
                                onClick={() => {
                                    onRefresh?.();
                                    setMobileMenuOpen(false);
                                }}
                                disabled={isRefreshing}
                                className="w-full justify-center"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Rafraîchir les données
                            </GlassButton>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
