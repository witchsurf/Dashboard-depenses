'use client';

import { useState, useMemo } from 'react';
import {
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Download,
    Search,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../ui/GlassComponents';
import { formatCurrency, exportToCSV } from '@/lib/utils';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    format?: 'currency' | 'number' | 'text';
    align?: 'left' | 'center' | 'right';
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    data: Record<string, string | number>[];
    columns: Column[];
    title?: string;
    pageSize?: number;
    exportFilename?: string;
    isLoading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({
    data,
    columns,
    title = 'Données',
    pageSize = 10,
    exportFilename = 'export-donnees',
    isLoading = false
}: DataTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data by search query
    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return data;

        const query = searchQuery.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(query)
            )
        );
    }, [data, searchQuery]);

    // Sort filtered data
    const sortedData = useMemo(() => {
        if (!sortColumn || !sortDirection) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];

            // Handle numbers
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Handle strings
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr, 'fr');
            }
            return bStr.localeCompare(aStr, 'fr');
        });
    }, [filteredData, sortColumn, sortDirection]);

    // Paginate
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    // Reset page when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            // Cycle through: asc -> desc -> null
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortColumn(null);
                setSortDirection(null);
            }
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const handleExport = () => {
        exportToCSV(filteredData, exportFilename);
    };

    const formatValue = (value: string | number, format?: string) => {
        if (typeof value === 'number') {
            if (format === 'currency') {
                return formatCurrency(value);
            }
            return new Intl.NumberFormat('fr-FR').format(value);
        }
        return value;
    };

    const getSortIcon = (columnKey: string) => {
        if (sortColumn !== columnKey) {
            return <ChevronUp className="w-4 h-4 opacity-30" />;
        }
        if (sortDirection === 'asc') {
            return <ChevronUp className="w-4 h-4" />;
        }
        return <ChevronDown className="w-4 h-4" />;
    };

    return (
        <GlassCard padding="none" className="overflow-hidden">
            {/* Header with search and export */}
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                        <GlassInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Rechercher..."
                            aria-label="Rechercher dans le tableau"
                            className="pl-10 w-full sm:w-60"
                        />
                    </div>
                    <GlassButton onClick={handleExport} size="sm">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exporter CSV</span>
                    </GlassButton>
                </div>
            </div>

            {/* Mobile Card View (Visible on small screens) */}
            <div className="block sm:hidden space-y-4">
                {paginatedData.map((row) => (
                    <div key={row.id} className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="font-semibold text-white">{String(row.category)}</p>
                                <p className="text-sm text-white/60">{row.date}</p>
                            </div>
                            <span className="font-bold text-lg whitespace-nowrap">
                                {formatCurrency(Number(row.amount))}
                            </span>
                        </div>

                        {row.subcategory && (
                            <div className="text-sm text-white/70 bg-white/5 rounded px-2 py-1 w-fit">
                                {row.subcategory}
                            </div>
                        )}

                        {row.description && (
                            <p className="text-sm text-white/50 italic border-l-2 border-white/10 pl-2">
                                {row.description}
                            </p>
                        )}

                        {/* Status/Type indicators if needed, derived from category or other fields */}
                    </div>
                ))}
                {paginatedData.length === 0 && (
                    <div className="text-center py-8 text-white/50">
                        Aucun résultat trouvé
                    </div>
                )}
            </div>

            {/* Desktop/Tablet Table View (Hidden on small screens) */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="data-table min-w-[800px]">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`
                    ${col.sortable !== false ? 'cursor-pointer hover:bg-white/10 select-none' : ''}
                    ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                  `}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    aria-sort={
                                        sortColumn === col.key
                                            ? sortDirection === 'asc' ? 'ascending' : 'descending'
                                            : undefined
                                    }
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable !== false && getSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8">
                                    Chargement...
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8">
                                    Aucun résultat trouvé
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row) => (
                                <tr key={row.id} className="hover:bg-white/5 transition-colors">
                                    {columns.map((col) => (
                                        <td
                                            key={`${row.id}-${col.key}`}
                                            className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}
                                        >
                                            {col.render ? col.render(row[col.key], row) : formatValue(row[col.key], col.format)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer with total and pagination */}
            <div className="p-4 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-center md:text-left">
                    <p className="text-sm text-white/60">
                        {sortedData.length} résultat{sortedData.length > 1 ? 's' : ''}
                        {searchQuery && ` pour "${searchQuery}"`}
                    </p>
                    {sortedData.length > 0 && columns.some(c => c.key === 'amount') && (
                        <p className="text-lg font-bold text-purple-400 mt-1">
                            Total: {formatCurrency(
                                sortedData.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
                            )}
                        </p>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        <GlassButton
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            aria-label="Première page"
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </GlassButton>
                        <GlassButton
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Page précédente"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </GlassButton>
                        <span className="px-3 text-sm whitespace-nowrap">
                            Page {currentPage} / {totalPages}
                        </span>
                        <GlassButton
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Page suivante"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </GlassButton>
                        <GlassButton
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            aria-label="Dernière page"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </GlassButton>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
