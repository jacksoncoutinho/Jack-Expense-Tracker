import React from 'react';
import { Transaction } from '../types';
import { Icons } from './ui/Icons';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  currency: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, currency }) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Icons.Calendar className="w-12 h-12 mb-3 opacity-20" />
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      {transactions.map((t) => (
        <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {t.type === 'income' ? <Icons.TrendingUp size={18} /> : <Icons.TrendingDown size={18} />}
            </div>
            <div>
              <p className="font-medium text-gray-900">{t.description || t.category}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{t.category}</span>
                <span>•</span>
                <span>{new Date(t.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
              {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toFixed(2)}
            </span>
            <button 
              onClick={() => onDelete(t.id)}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
            >
              <Icons.Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};