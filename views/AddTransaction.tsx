import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { getCategories } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { Icons } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';

interface AddTransactionProps {
  onAdd: (t: Transaction) => void;
  onCancel: () => void;
  currency: string;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd, onCancel, currency }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loaded = getCategories();
    setCategories(loaded);
    if (loaded.length > 0) {
      setFormData(prev => ({ ...prev, category: loaded[0].name }));
    }
  }, []);

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsProcessing(true);
    
    const categoryNames = categories.map(c => c.name);
    const result = await geminiService.parseTransaction(aiInput, categoryNames);
    
    if (result) {
      setFormData({
        amount: result.amount?.toString() || '',
        type: result.type || 'expense',
        category: result.category || categories[0].name,
        description: result.description || aiInput,
        date: result.date ? result.date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    }
    
    setIsProcessing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      createdAt: Date.now()
    };

    onAdd(newTransaction);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

      {/* AI Smart Input */}
      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <div className="flex items-center gap-2 mb-2 text-indigo-700 font-medium">
          <Icons.Sparkles size={18} />
          <span>AI Magic Fill</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Lunch with team 45"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            className="flex-1 rounded-lg border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border"
          />
          <Button 
            size="sm" 
            onClick={handleAiParse} 
            disabled={isProcessing || !aiInput}
            className="whitespace-nowrap"
          >
            {isProcessing ? <Icons.Loader2 className="animate-spin" size={18} /> : 'Parse'}
          </Button>
        </div>
        <p className="text-xs text-indigo-400 mt-2">
          Describe your spending and let Gemini fill the form.
        </p>
      </div>

      {/* Manual Form */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-1 rounded-lg">
        
        {/* Toggle Type */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              formData.type === 'expense' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`py-2 rounded-lg text-sm font-medium transition-all ${
              formData.type === 'income' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currency}</span>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="block w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-semibold"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
            {categories.filter(c => c.type === formData.type).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.name })}
                className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                  formData.category === cat.name
                    ? 'border-primary bg-indigo-50 text-primary font-medium'
                    : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="What was this for?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="block w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth size="lg">Save Transaction</Button>
        </div>
      </form>
    </div>
  );
};