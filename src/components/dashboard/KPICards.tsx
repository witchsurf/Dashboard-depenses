'use client';

import { KPIData } from '@/types';
import { formatCurrency, formatNumber, formatPercentage, getTrend } from '@/lib/utils';
import { GlassCard } from '../ui/GlassComponents';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    kpi: KPIData;
    index?: number;
}

function KPICard({ kpi, index = 0 }: KPICardProps) {
    const formattedValue = (() => {
        switch (kpi.format) {
            case 'currency':
                return formatCurrency(kpi.value);
            case 'percentage':
                return formatPercentage(kpi.value);
            default:
                return formatNumber(kpi.value);
        }
    })();

    const trendIcon = (() => {
        switch (kpi.trend) {
            case 'up':
                return <TrendingUp className="w-4 h-4" />;
            case 'down':
                return <TrendingDown className="w-4 h-4" />;
            default:
                return <Minus className="w-4 h-4" />;
        }
    })();

    const trendColor = (() => {
        // For expenses, down is good; for revenue/savings, up is good
        const isExpenseMetric = kpi.label.toLowerCase().includes('dépense');
        if (kpi.trend === 'up') {
            return isExpenseMetric ? 'text-red-400' : 'text-emerald-400';
        }
        if (kpi.trend === 'down') {
            return isExpenseMetric ? 'text-emerald-400' : 'text-red-400';
        }
        return 'text-white/60';
    })();

    const changePercent = kpi.previousValue
        ? ((kpi.value - kpi.previousValue) / Math.abs(kpi.previousValue) * 100).toFixed(1)
        : null;

    return (
        <GlassCard
            className="relative overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Accent color bar */}
            <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ backgroundColor: kpi.color || '#8B5CF6' }}
            />

            <div className="pt-2">
                <p className="text-sm text-white/60 mb-1 truncate">{kpi.label}</p>
                <p
                    className="text-xl md:text-2xl font-bold truncate"
                    style={{ color: kpi.color || 'inherit' }}
                >
                    {formattedValue}
                </p>

                {kpi.trend && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
                        {trendIcon}
                        {changePercent && <span>{changePercent}%</span>}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}

interface KPICardsProps {
    kpis: KPIData[];
}

export function KPICards({ kpis }: KPICardsProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {kpis.map((kpi, index) => (
                <KPICard key={kpi.label} kpi={kpi} index={index} />
            ))}
        </div>
    );
}
