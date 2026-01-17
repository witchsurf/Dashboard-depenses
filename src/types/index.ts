// Data types for the dashboard

export interface SheetRow {
    [key: string]: string | number | null;
}

export interface SheetData {
    headers: string[];
    rows: SheetRow[];
    sheetName: string;
    lastUpdated: Date;
}

export interface ColumnSchema {
    name: string;
    type: 'date' | 'numeric' | 'category' | 'text';
    isComputed?: boolean;
    format?: string;
}

export interface ColumnMapping {
    dateColumn: string | null;
    valueColumns: string[];
    categoryColumns: string[];
}

export interface KPIData {
    label: string;
    value: number;
    previousValue?: number;
    format: 'currency' | 'number' | 'percentage';
    trend?: 'up' | 'down' | 'stable';
    color?: string;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: string | number;
}

export interface FilterState {
    dateRange: {
        start: Date | null;
        end: Date | null;
    };
    categories: string[];
    searchQuery: string;
}

export interface DataSourceConfig {
    mode: 'api' | 'csv' | 'mock';
    isConnected: boolean;
    sheetId?: string;
    csvUrl?: string;
    availableTabs?: string[];
    selectedTab?: string;
    error?: string;
    statusMessage?: string;
    lastUpdated?: string;
}

export interface DashboardState {
    data: SheetData | null;
    config: DataSourceConfig;
    columnMapping: ColumnMapping;
    columnSchemas: ColumnSchema[];
    filters: FilterState;
    isLoading: boolean;
    error: string | null;
}

// Category structure for the budget
export interface BudgetCategory {
    name: string;
    items: BudgetItem[];
    total: number[];
}

export interface BudgetItem {
    name: string;
    values: number[];
    total: number;
    average: number;
}

export interface BudgetData {
    revenus: BudgetCategory;
    depenses: BudgetCategory[];
    summary: {
        totalRevenus: number[];
        totalDepenses: number[];
        net: number[];
        epargne: number[];
    };
    months: string[];
}
