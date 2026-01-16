'use client';

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { GlassCard } from '../ui/GlassComponents';
import { formatCurrency, getChartColor } from '@/lib/utils';

interface DonutData {
    name: string;
    value: number;
}

interface DonutChartProps {
    data: DonutData[];
    title?: string;
    showLegend?: boolean;
}

export function DonutChart({
    data,
    title = 'Distribution',
    showLegend = true
}: DonutChartProps) {
    const total = data.reduce((sum, d) => sum + d.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0];
            const percentage = ((item.value / total) * 100).toFixed(1);

            return (
                <div className="glass-sm p-3">
                    <p className="font-semibold mb-1">{item.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.payload.fill }}>
                        {formatCurrency(item.value)}
                    </p>
                    <p className="text-sm text-white/60">{percentage}%</p>
                </div>
            );
        }
        return null;
    };

    const renderCustomizedLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: any) => {
        if (percent < 0.05) return null; // Hide labels for small slices

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const CustomLegend = ({ payload }: any) => (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-white/70">{entry.value}</span>
                </div>
            ))}
        </div>
    );

    return (
        <GlassCard>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <div className="h-[300px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius="50%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getChartColor(index)}
                                    stroke="rgba(0,0,0,0.2)"
                                    strokeWidth={1}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        {showLegend && <Legend content={<CustomLegend />} />}
                    </PieChart>
                </ResponsiveContainer>
            </div>
            {/* Center text showing total */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
                <div className="text-center">
                    <p className="text-sm text-white/60">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(total)}</p>
                </div>
            </div>
        </GlassCard>
    );
}
