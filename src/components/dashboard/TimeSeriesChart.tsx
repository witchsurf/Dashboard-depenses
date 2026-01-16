'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '../ui/GlassComponents';
import { formatCurrency } from '@/lib/utils';

interface TimeSeriesData {
    name: string;
    revenus: number;
    depenses: number;
    net?: number;
    epargne?: number;
}

interface TimeSeriesChartProps {
    data: TimeSeriesData[];
    title?: string;
    showEpargne?: boolean;
}

export function TimeSeriesChart({
    data,
    title = 'Évolution Mensuelle',
    showEpargne = false
}: TimeSeriesChartProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-sm p-3 min-w-[180px]">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between gap-4 text-sm">
                            <span style={{ color: entry.color }}>{entry.name}</span>
                            <span className="font-medium">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
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
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.1)"
                        />
                        <XAxis
                            dataKey="name"
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            formatter={(value) => (
                                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
                            )}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenus"
                            name="Revenus"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="depenses"
                            name="Dépenses"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{ fill: '#EF4444', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: 'white' }}
                        />
                        {showEpargne && (
                            <Line
                                type="monotone"
                                dataKey="epargne"
                                name="Épargne"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 3 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
}
