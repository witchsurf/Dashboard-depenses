'use client';

import { useState } from 'react';
import { Calendar, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../ui/GlassComponents';
import { FilterState } from '@/types';
import { FRENCH_MONTHS_FULL } from '@/lib/utils';

interface FiltersProps {
    categories: string[];
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

export function Filters({ categories, filters, onFiltersChange }: FiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = (key: keyof FilterState, value: any) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const toggleCategory = (category: string) => {
        const current = filters.categories;
        const updated = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category];
        updateFilter('categories', updated);
    };

    const clearFilters = () => {
        onFiltersChange({
            dateRange: { start: null, end: null },
            categories: [],
            searchQuery: '',
        });
    };

    const hasActiveFilters =
        filters.categories.length > 0 ||
        filters.searchQuery ||
        filters.dateRange.start ||
        filters.dateRange.end;

    return (
        <GlassCard padding="none" className="overflow-hidden">
            {/* Header - always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5" />
                    <span className="font-medium">Filtres</span>
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 text-xs bg-purple-500/30 text-purple-300 rounded-full">
                            {filters.categories.length + (filters.searchQuery ? 1 : 0)} actif(s)
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-white/60" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
                <div className="p-4 pt-0 border-t border-white/10 space-y-4 animate-slide-up">
                    {/* Search */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Recherche</label>
                        <GlassInput
                            value={filters.searchQuery}
                            onChange={(value) => updateFilter('searchQuery', value)}
                            placeholder="Rechercher..."
                            type="search"
                            aria-label="Rechercher"
                        />
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Période
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <GlassInput
                                type="date"
                                className="w-full text-sm"
                                value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                                onChange={(value) => {
                                    if (value) {
                                        updateFilter('dateRange', { ...filters.dateRange, start: new Date(value) });
                                    } else {
                                        updateFilter('dateRange', { ...filters.dateRange, start: null });
                                    }
                                }}
                                aria-label="Date de début"
                            />
                            <GlassInput
                                type="date"
                                className="w-full text-sm"
                                value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                                onChange={(value) => {
                                    if (value) {
                                        updateFilter('dateRange', { ...filters.dateRange, end: new Date(value) });
                                    } else {
                                        updateFilter('dateRange', { ...filters.dateRange, end: null });
                                    }
                                }}
                                aria-label="Date de fin"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div>
                            <label className="block text-sm text-white/60 mb-2">Catégories</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => {
                                    const isSelected = filters.categories.includes(category);
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => toggleCategory(category)}
                                            className={`
                        px-3 py-1.5 text-sm rounded-lg border transition-all
                        ${isSelected
                                                    ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                                                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                                }
                      `}
                                            aria-pressed={isSelected}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <GlassButton
                            onClick={clearFilters}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-white/60 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                            Effacer les filtres
                        </GlassButton>
                    )}
                </div>
            )}
        </GlassCard>
    );
}
