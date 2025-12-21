import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { TransactionList } from '../components/TransactionList';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Icons } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { getCategories } from '../services/storageService';

interface DashboardProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onNavigateAdd: () => void;
  currency: string;
}

const CHART_COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f97316', 
  '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6'
];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, onDelete, onNavigateAdd, currency }) => {
  const [pieView, setPieView] = useState<'week' | 'month'>('week');
  
  // Load categories to get colors
  const categories = useMemo(() => getCategories(), []);

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const balance = summary.income - summary.expense;

  // Daily Stacked Bar Chart Data (Last 7 Days)
  const stackedBarData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    // Track which categories are actually used in this period to create bars for them
    const activeCategories = new Set<string>();

    const data = last7Days.map(date => {
      const dayTransactions = transactions.filter(t => t.date.startsWith(date) && t.type === 'expense');
      
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      const dayData: any = { day: dayName, total: 0, date }; // date for key if needed

      dayTransactions.forEach(t => {
        // Accumulate amount per category
        dayData[t.category] = (dayData[t.category] || 0) + t.amount;
        dayData.total += t.amount;
        activeCategories.add(t.category);
      });

      return dayData;
    });

    return { data, keys: Array.from(activeCategories) };
  }, [transactions]);

  // Pie Chart Data Logic
  const getCategoryData = (view: 'week' | 'month') => {
    const now = new Date();
    
    // Determine start date filter
    let filterFn: (d: Date) => boolean;
    
    if (view === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      // Reset time to start of day for accurate comparison
      oneWeekAgo.setHours(0,0,0,0);
      
      filterFn = (d) => d >= oneWeekAgo;
    } else {
      filterFn = (d) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    const filteredTxs = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return filterFn(d);
    });

    const grouped = filteredTxs.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      // Fix arithmetic operation error by explicitly converting to Number for sort comparison
      .sort((a, b) => Number(b.value) - Number(a.value));
  };

  const pieChartData = useMemo(() => getCategoryData(pieView), [transactions, pieView]);

  // Helper to get color for a category name
  const getCategoryColor = (name: string) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#cbd5e1'; // default slate-300
  };

  // Custom Tooltip for Stacked Bar
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // payload contains the stack items. We want to sort them by value desc
      // Fix arithmetic operation error by explicitly converting to Number
      const sortedPayload = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
      const total = sortedPayload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-xs">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 mb-2">
            {sortedPayload.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900">{currency}{Number(entry.value).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
        <p className="text-indigo-100 text-sm font-medium mb-1">Total Balance</p>
        <h1 className="text-4xl font-bold mb-6">{currency}{balance.toFixed(2)}</h1>
        
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 text-green-300 mb-1">
              <Icons.TrendingUp size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Income</span>
            </div>
            <p className="font-semibold text-lg">{currency}{summary.income.toFixed(2)}</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-300 mb-1">
              <Icons.TrendingDown size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Expense</span>
            </div>
            <p className="font-semibold text-lg">{currency}{summary.expense.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Daily Spending Stacked Bar Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wide">Daily Spending (Last 7 Days)</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData.data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#9ca3af' }} 
                dy={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
              {/* Render a Bar for each category present in the data */}
              {stackedBarData.keys.map(key => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  stackId="a" 
                  fill={getCategoryColor(key)} 
                  radius={[0, 0, 0, 0]} // Reset radius for stacked
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {stackedBarData.keys.slice(0, 5).map(key => (
               <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(key) }} />
                  <span className="text-[10px] text-gray-500">{key}</span>
               </div>
            ))}
            {stackedBarData.keys.length > 5 && (
               <span className="text-[10px] text-gray-400">+{stackedBarData.keys.length - 5} more</span>
            )}
        </div>
      </div>

      {/* Category Pie Charts */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold text-sm uppercase tracking-wide">Category Breakdown</h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setPieView('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${pieView === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Week
            </button>
            <button 
               onClick={() => setPieView('month')}
               className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${pieView === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="h-64 w-full relative">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${currency}${value.toFixed(2)}`, '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <Icons.PieChart className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">No expenses for this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 font-semibold text-lg">Recent</h3>
          <Button variant="ghost" size="sm" onClick={onNavigateAdd}>
             <Icons.Plus size={16} className="mr-1" /> Add
          </Button>
        </div>
        {/* Fixed: Replaced undefined 'handleDeleteTransaction' with the correct 'onDelete' prop */}
        <TransactionList transactions={transactions.slice(0, 5)} onDelete={onDelete} currency={currency} />
      </div>
    </div>
  );
};
