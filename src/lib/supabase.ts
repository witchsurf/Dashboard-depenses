import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for expenses table
export interface DBExpense {
    id: string;
    date: string;
    amount: number;
    category: string;
    subcategory: string | null;
    description: string | null;
    created_at: string;
    synced_from_local: boolean;
}

// Insert a new expense
export async function insertExpense(expense: Omit<DBExpense, 'id' | 'created_at'>) {
    const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get all expenses
export async function getExpenses(options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
}) {
    let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

    if (options?.startDate) {
        query = query.gte('date', options.startDate);
    }
    if (options?.endDate) {
        query = query.lte('date', options.endDate);
    }
    if (options?.category) {
        query = query.eq('category', options.category);
    }
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DBExpense[];
}

// Get expenses grouped by day
export async function getExpensesByDay(startDate?: string, endDate?: string) {
    let query = supabase
        .from('expenses')
        .select('date, amount, category')
        .order('date', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    // Group by date
    const grouped: Record<string, { total: number; byCategory: Record<string, number> }> = {};

    for (const expense of data || []) {
        if (!grouped[expense.date]) {
            grouped[expense.date] = { total: 0, byCategory: {} };
        }
        grouped[expense.date].total += expense.amount;
        grouped[expense.date].byCategory[expense.category] =
            (grouped[expense.date].byCategory[expense.category] || 0) + expense.amount;
    }

    return grouped;
}

// Get expenses grouped by category
export async function getExpensesByCategory(startDate?: string, endDate?: string) {
    let query = supabase
        .from('expenses')
        .select('category, amount');

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    // Group by category
    const grouped: Record<string, number> = {};

    for (const expense of data || []) {
        grouped[expense.category] = (grouped[expense.category] || 0) + expense.amount;
    }

    return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

// Get monthly summary
export async function getMonthlySummary(year?: number) {
    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const { data, error } = await supabase
        .from('expenses')
        .select('date, amount')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;

    // Group by month
    const monthlyTotals: number[] = Array(12).fill(0);

    for (const expense of data || []) {
        const month = new Date(expense.date).getMonth();
        monthlyTotals[month] += expense.amount;
    }

    return monthlyTotals;
}

// Delete expense
export async function deleteExpense(id: string) {
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// Update expense
export async function updateExpense(id: string, updates: Partial<DBExpense>) {
    const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!(supabaseUrl && supabaseAnonKey);
}
