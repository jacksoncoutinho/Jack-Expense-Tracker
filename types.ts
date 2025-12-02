export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO String
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface DailySummary {
  date: string;
  income: number;
  expense: number;
}

export interface ChartDataPoint {
  day: string;
  amount: number;
}

export interface DriveConfig {
  isConnected: boolean;
  clientId: string; // User provided Client ID
  fileName: string;
  fileId?: string; // ID of the file in Drive
  lastSync?: string;
}