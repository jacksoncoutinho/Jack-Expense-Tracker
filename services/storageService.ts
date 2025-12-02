import { Transaction, Category, DriveConfig } from '../types';

const TRANSACTIONS_KEY = 'gemini_tracker_transactions';
const CATEGORIES_KEY = 'gemini_tracker_categories';
const CURRENCY_KEY = 'gemini_tracker_currency';
const DRIVE_CONFIG_KEY = 'gemini_tracker_drive_config';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Food', type: 'expense', color: '#ef4444' },
  { id: '2', name: 'Transport', type: 'expense', color: '#f97316' },
  { id: '3', name: 'Shopping', type: 'expense', color: '#ec4899' },
  { id: '4', name: 'Bills', type: 'expense', color: '#6366f1' },
  { id: '5', name: 'Entertainment', type: 'expense', color: '#8b5cf6' },
  { id: '6', name: 'Salary', type: 'income', color: '#22c55e' },
  { id: '7', name: 'Freelance', type: 'income', color: '#10b981' },
];

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveTransaction = (transaction: Transaction): Transaction[] => {
  const current = getTransactions();
  const updated = [transaction, ...current];
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string): Transaction[] => {
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  return updated;
};

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
};

export const saveCategory = (category: Category): Category[] => {
  const current = getCategories();
  // Simple check to avoid duplicates by name and type
  if (current.some(c => c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type)) {
    return current;
  }
  const updated = [...current, category];
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteCategory = (id: string): Category[] => {
  const current = getCategories();
  // Allow deleting any category, but we might want to warn user in UI if it's in use.
  // For now, simple delete.
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  return updated;
};

export const getCurrency = (): string => {
  return localStorage.getItem(CURRENCY_KEY) || '$';
};

export const saveCurrency = (currency: string): void => {
  localStorage.setItem(CURRENCY_KEY, currency);
};

export const getDriveConfig = (): DriveConfig => {
  const stored = localStorage.getItem(DRIVE_CONFIG_KEY);
  return stored ? JSON.parse(stored) : {
    isConnected: false,
    folderName: 'Gemini Expenses',
    fileName: 'transactions.csv',
    autoSync: false
  };
};

export const saveDriveConfig = (config: DriveConfig): void => {
  localStorage.setItem(DRIVE_CONFIG_KEY, JSON.stringify(config));
};

// Mimics the "Drive File" requirement by generating a CSV blob
export const exportToCSV = (fileName: string = 'expenses_backup.csv') => {
  const transactions = getTransactions();
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString(),
    t.type,
    t.category,
    `"${t.description}"`, // Quote description to handle commas
    t.amount.toFixed(2)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  // Ensure filename ends in .csv
  const safeFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  link.setAttribute('download', safeFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCategories = (fileName: string = 'categories_config.json') => {
  const categories = getCategories();
  const jsonContent = JSON.stringify(categories, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  // Ensure filename ends in .json
  const safeFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  link.setAttribute('download', safeFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};