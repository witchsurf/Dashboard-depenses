'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { GlassCard } from '../ui/GlassComponents';
import { formatCurrency, getChartColor } from '@/lib/utils';

interface CategoryData {
    name: string;
    value: number;
}

interface CategoryBarChartProps {
    data: CategoryData[];
    title?: string;
    onCategoryClick?: (category: string) => void;
}

export function CategoryBarChart({
    data,
    title = 'Répartition par Catégorie',
    onCategoryClick,
}: CategoryBarChartProps) {
    // Sort by value descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const percentage = ((item.value / total) * 100).toFixed(1);

            return (
                <div className="glass-sm p-3">
                    <p className="font-semibold mb-1">{item.payload.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>
                        {formatCurrency(item.value)}
                    </p>
                    <p className="text-sm text-white/60">{percentage}% du total</p>
                </div>
            );
        }
        return null;
    };

    return (
        <GlassCard>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                            horizontal={true}
                            vertical={false}
                        />
                        <XAxis
                            type="number"
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={11}
                            tickLine={false}
                            width={100}
                            tick={{ fill: 'rgba(255,255,255,0.7)' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={40}
                            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                            onClick={(data) => onCategoryClick?.(data.name)}
                        >
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
