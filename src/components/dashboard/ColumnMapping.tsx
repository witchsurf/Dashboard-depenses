'use client';

import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { GlassCard, GlassButton, GlassSelect } from '../ui/GlassComponents';
import { ColumnSchema, ColumnMapping } from '@/types';

interface ColumnMappingUIProps {
    schemas: ColumnSchema[];
    mapping: ColumnMapping;
    onMappingChange: (mapping: ColumnMapping) => void;
}

export function ColumnMappingUI({ schemas, mapping, onMappingChange }: ColumnMappingUIProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const columnOptions = schemas.map(s => ({ value: s.name, label: `${s.name} (${s.type})` }));

    const numericColumns = schemas
        .filter(s => s.type === 'numeric')
        .map(s => ({ value: s.name, label: s.name }));

    const categoryColumns = schemas
        .filter(s => s.type === 'category' || s.type === 'text')
        .map(s => ({ value: s.name, label: s.name }));

    const toggleValueColumn = (colName: string) => {
        const current = mapping.valueColumns;
        const updated = current.includes(colName)
            ? current.filter(c => c !== colName)
            : [...current, colName];
        onMappingChange({ ...mapping, valueColumns: updated });
    };

    const toggleCategoryColumn = (colName: string) => {
        const current = mapping.categoryColumns;
        const updated = current.includes(colName)
            ? current.filter(c => c !== colName)
            : [...current, colName];
        onMappingChange({ ...mapping, categoryColumns: updated });
    };

    return (
        <GlassCard padding="none" className="overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Mapping des colonnes</span>
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
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>
                                Les colonnes ont été détectées automatiquement. Vous pouvez ajuster le mapping si nécessaire.
                            </p>
                        </div>
                    </div>

                    {/* Date Column */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2">Colonne Date</label>
                        <GlassSelect
                            value={mapping.dateColumn || ''}
                            onChange={(value) => onMappingChange({ ...mapping, dateColumn: value || null })}
                            options={[
                                { value: '', label: 'Aucune' },
                                ...columnOptions
                            ]}
                            aria-label="Sélectionner la colonne date"
                        />
                    </div>

                    {/* Value Columns */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2">
                            Colonnes Valeurs (numériques)
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {numericColumns.map((col) => {
                                const isSelected = mapping.valueColumns.includes(col.value);
                                return (
                                    <button
                                        key={col.value}
                                        onClick={() => toggleValueColumn(col.value)}
                                        className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1
                      ${isSelected
                                                ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200'
                                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }
                    `}
                                        aria-pressed={isSelected}
                                    >
                                        {isSelected && <Check className="w-3 h-3" />}
                                        {col.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Columns */}
                    <div>
                        <label className="block text-sm text-white/60 mb-2">
                            Colonnes Catégories
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {categoryColumns.map((col) => {
                                const isSelected = mapping.categoryColumns.includes(col.value);
                                return (
                                    <button
                                        key={col.value}
                                        onClick={() => toggleCategoryColumn(col.value)}
                                        className={`
                      px-3 py-1.5 text-sm rounded-lg border transition-all flex items-center gap-1
                      ${isSelected
                                                ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200'
                                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                            }
                    `}
                                        aria-pressed={isSelected}
                                    >
                                        {isSelected && <Check className="w-3 h-3" />}
                                        {col.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="pt-2 border-t border-white/10 text-sm text-white/60">
                        <p>
                            <strong>{mapping.valueColumns.length}</strong> colonne(s) valeur ·
                            <strong> {mapping.categoryColumns.length}</strong> colonne(s) catégorie
                            {mapping.dateColumn && <> · Date: <strong>{mapping.dateColumn}</strong></>}
                        </p>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
