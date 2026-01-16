'use client';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
            aria-hidden="true"
        />
    );
}

export function KPICardSkeleton() {
    return (
        <div className="glass-card animate-pulse">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

export function ChartSkeleton() {
    // Deterministic heights to avoid hydration mismatch
    const heights = [65, 45, 80, 55, 70, 40, 85, 60, 75, 50, 90, 55];

    return (
        <div className="glass-card animate-pulse">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="flex items-end gap-2 h-64">
                {heights.map((h, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1"
                        height={`${h}%`}
                    />
                ))}
            </div>
        </div>
    );
}

export function TableRowSkeleton({ columns = 6 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
    return (
        <div className="glass overflow-hidden">
            <table className="data-table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <Skeleton className="h-4 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <KPICardSkeleton key={i} />
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Table skeleton */}
            <TableSkeleton rows={8} columns={5} />
        </div>
    );
}
