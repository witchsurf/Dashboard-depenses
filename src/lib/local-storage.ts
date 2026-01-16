import { SheetRow } from '@/types';

/**
 * Local expense storage for new entries
 * Stores in a JSON file and syncs to Google Sheets when possible
 */

export interface LocalExpense {
    id: string;
    date: string; // YYYY-MM-DD format
    amount: number;
    category: string;
    subcategory?: string;
    description?: string;
    createdAt: string;
    synced: boolean;
}

// Default expense categories based on user's Google Sheet structure
export const EXPENSE_CATEGORIES = [
    {
        name: 'MAISON',
        subcategories: ['Loyers/emprunt', 'Électricité/gaz', 'Eau', 'Ménage', 'Téléphones', 'Internet', 'Réparations', 'Équipements', 'Déco']
    },
    {
        name: 'VIE QUOTIDIENNE',
        subcategories: ['Courses', 'Habillement', 'Sorties', 'Coiffeur', 'Divers']
    },
    {
        name: 'ENFANTS',
        subcategories: ['Habillement', 'Frais études', 'Argent de poche', 'Activités', 'Transports', 'Santé', 'Jeux/loisirs', 'Divers']
    },
    {
        name: 'TRANSPORT',
        subcategories: ['Essence/électricité', 'Réparations', 'Transport en commun', 'Taxi', 'Divers']
    },
    {
        name: 'SANTÉ',
        subcategories: ['Médecins/dentiste', 'Médicaments', 'Mutuelle', 'Urgences', 'Divers']
    },
    {
        name: 'ASSURANCES',
        subcategories: ['Auto', 'Habitation', 'Assurance vie', 'Assurance scolaire']
    },
    {
        name: 'ÉPARGNE',
        subcategories: ['Épargne logement', 'Épargne Livret', 'Retraite', 'Investissements', 'Projets']
    },
    {
        name: 'LOISIRS',
        subcategories: ['Vidéos/DVDs', 'Musique', 'Jeux', 'Cinéma', 'Concerts', 'Livres', 'Sports', 'Sorties', 'Divers']
    },
    {
        name: 'DIVERS',
        subcategories: ['Frais de banque', 'Remboursements prêts', 'Pressing', 'Autre']
    },
];

// Quick access categories for daily expenses
export const QUICK_CATEGORIES = [
    { category: 'VIE QUOTIDIENNE', subcategory: 'Courses', icon: '🛒' },
    { category: 'TRANSPORT', subcategory: 'Essence/électricité', icon: '⛽' },
    { category: 'VIE QUOTIDIENNE', subcategory: 'Sorties', icon: '🍽️' },
    { category: 'MAISON', subcategory: 'Électricité/gaz', icon: '💡' },
    { category: 'SANTÉ', subcategory: 'Médicaments', icon: '💊' },
    { category: 'ENFANTS', subcategory: 'Argent de poche', icon: '👶' },
];

const STORAGE_KEY = 'dashboard_expenses';

/**
 * Generate unique ID
 */
function generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all local expenses
 */
export function getLocalExpenses(): LocalExpense[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/**
 * Save expense locally
 */
export function saveLocalExpense(expense: Omit<LocalExpense, 'id' | 'createdAt' | 'synced'>): LocalExpense {
    const newExpense: LocalExpense = {
        ...expense,
        id: generateId(),
        createdAt: new Date().toISOString(),
        synced: false,
    };

    const expenses = getLocalExpenses();
    expenses.unshift(newExpense); // Add to beginning

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }

    return newExpense;
}

/**
 * Mark expense as synced
 */
export function markExpenseSynced(id: string): void {
    const expenses = getLocalExpenses();
    const index = expenses.findIndex(e => e.id === id);

    if (index !== -1) {
        expenses[index].synced = true;
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
        }
    }
}

/**
 * Delete expense
 */
export function deleteLocalExpense(id: string): void {
    const expenses = getLocalExpenses();
    const filtered = expenses.filter(e => e.id !== id);

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}

/**
 * Get unsynced expenses
 */
export function getUnsyncedExpenses(): LocalExpense[] {
    return getLocalExpenses().filter(e => !e.synced);
}

/**
 * Convert local expense to table row format
 */
export function expenseToTableRow(expense: LocalExpense): Record<string, string | number> {
    const date = new Date(expense.date);
    const monthNames = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[date.getMonth()];

    return {
        'Catégorie': expense.category,
        'Sous-catégorie': expense.subcategory || expense.description || '',
        [month]: expense.amount,
        'Total': expense.amount,
        'Moyenne': expense.amount,
        '_isLocal': 1, // Flag for local entries
        '_id': expense.id,
    };
}

/**
 * Get expenses grouped by month for the current year
 */
export function getExpensesByMonth(): Record<string, number> {
    const expenses = getLocalExpenses();
    const monthTotals: Record<string, number> = {};
    const monthNames = ['JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Initialize all months
    monthNames.forEach(m => monthTotals[m] = 0);

    expenses.forEach(exp => {
        const date = new Date(exp.date);
        const month = monthNames[date.getMonth()];
        monthTotals[month] += exp.amount;
    });

    return monthTotals;
}

/**
 * Get expenses grouped by category
 */
export function getExpensesByCategory(): Record<string, number> {
    const expenses = getLocalExpenses();
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(exp => {
        if (!categoryTotals[exp.category]) {
            categoryTotals[exp.category] = 0;
        }
        categoryTotals[exp.category] += exp.amount;
    });

    return categoryTotals;
}
