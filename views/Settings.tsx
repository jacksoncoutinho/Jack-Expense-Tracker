import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { exportToCSV, exportCategories, getDriveConfig, saveDriveConfig, getCategories, saveCategory, deleteCategory } from '../services/storageService';
import { DriveConfig, Category, TransactionType } from '../types';

interface SettingsProps {
  currency: string;
  onCurrencyChange: (c: string) => void;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
  '#f43f5e', '#64748b'
];

export const Settings: React.FC<SettingsProps> = ({ currency, onCurrencyChange }) => {
  // Drive Config State
  const [driveConfig, setDriveConfig] = useState<DriveConfig>({
    isConnected: false,
    folderName: 'Gemini Expenses',
    fileName: 'transactions.csv',
    autoSync: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Category Management State
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [isAddingCat, setIsAddingCat] = useState(false);

  useEffect(() => {
    setDriveConfig(getDriveConfig());
    setCategories(getCategories());
  }, []);

  const handleDriveConfigChange = (key: keyof DriveConfig, value: any) => {
    const newConfig = { ...driveConfig, [key]: value };
    setDriveConfig(newConfig);
    saveDriveConfig(newConfig);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate API connection delay
    setTimeout(() => {
      handleDriveConfigChange('isConnected', true);
      setIsConnecting(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    handleDriveConfigChange('isConnected', false);
    handleDriveConfigChange('lastSync', undefined);
  };

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate upload delay then trigger download for both files
    setTimeout(() => {
      // 1. Export Transactions
      exportToCSV(driveConfig.fileName);
      
      // 2. Export Categories Configuration
      // We use a separate timeout to ensure the browser handles both downloads
      setTimeout(() => {
        exportCategories('categories_config.json');
      }, 500);

      handleDriveConfigChange('lastSync', new Date().toLocaleString());
      setIsSyncing(false);
    }, 1000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      type: activeTab,
      color: newCatColor
    };

    const updated = saveCategory(newCategory);
    setCategories(updated);
    setNewCatName('');
    setIsAddingCat(false);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = deleteCategory(id);
    setCategories(updated);
  };

  const currencies = [
    { label: 'USD ($)', symbol: '$' },
    { label: 'EUR (€)', symbol: '€' },
    { label: 'GBP (£)', symbol: '£' },
    { label: 'JPY (¥)', symbol: '¥' },
    { label: 'INR (₹)', symbol: '₹' },
    { label: 'CAD (C$)', symbol: 'C$' },
    { label: 'AUD (A$)', symbol: 'A$' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* Currency Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
         <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
            <Icons.Settings size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Preferences</h3>
            <p className="text-sm text-gray-500">App configuration</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
          <div className="grid grid-cols-3 gap-2">
            {currencies.map((c) => (
              <button
                key={c.symbol}
                onClick={() => onCurrencyChange(c.symbol)}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  currency === c.symbol
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-full">
            <Icons.Tag size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Manage Categories</h3>
            <p className="text-sm text-gray-500">Customize your spending types</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {categories.filter(c => c.type === activeTab).map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                <span className="text-gray-900 font-medium text-sm">{cat.name}</span>
              </div>
              <button 
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <Icons.Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {categories.filter(c => c.type === activeTab).length === 0 && (
             <p className="text-center text-sm text-gray-400 py-2">No categories found.</p>
          )}
        </div>

        {isAddingCat ? (
          <form onSubmit={handleAddCategory} className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in">
             <div className="space-y-3">
               <div>
                 <label className="text-xs font-medium text-gray-500">Name</label>
                 <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category Name"
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                 />
               </div>
               <div>
                 <label className="text-xs font-medium text-gray-500">Color Tag</label>
                 <div className="flex flex-wrap gap-2 mt-1">
                   {COLORS.map(color => (
                     <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-6 h-6 rounded-full transition-transform ${newCatColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ backgroundColor: color }}
                     />
                   ))}
                 </div>
               </div>
               <div className="flex gap-2 pt-2">
                 <Button type="submit" size="sm" fullWidth>Add</Button>
                 <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddingCat(false)}>Cancel</Button>
               </div>
             </div>
          </form>
        ) : (
          <Button variant="secondary" fullWidth onClick={() => setIsAddingCat(true)} className="border-dashed">
            <Icons.Plus size={16} className="mr-2" /> Add New Category
          </Button>
        )}
      </div>

      {/* Google Drive Configuration */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full ${driveConfig.isConnected ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <Icons.Download size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Google Drive Backup</h3>
            <p className="text-sm text-gray-500">
              {driveConfig.isConnected ? 'Connected to Drive' : 'Configure backup location'}
            </p>
          </div>
        </div>

        {!driveConfig.isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Folder Name</label>
              <input 
                type="text" 
                value={driveConfig.folderName}
                onChange={(e) => handleDriveConfigChange('folderName', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. My Expenses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup File Name</label>
              <input 
                type="text" 
                value={driveConfig.fileName}
                onChange={(e) => handleDriveConfigChange('fileName', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="expenses.csv"
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleConnect} disabled={isConnecting} fullWidth variant="primary">
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <Icons.Loader2 className="animate-spin" size={18} /> Connecting...
                  </div>
                ) : (
                  'Connect Google Drive'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Requires Google Account authentication.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Status: Active</span>
                <span className="text-xs text-green-600 bg-white px-2 py-1 rounded-full border border-green-200">
                  Online
                </span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>Folder: <span className="font-semibold">{driveConfig.folderName}</span></p>
                <p>Files: <span className="font-semibold">{driveConfig.fileName}, categories_config.json</span></p>
                {driveConfig.lastSync && (
                  <p className="text-xs opacity-75 mt-2 pt-2 border-t border-green-200">
                    Last synced: {driveConfig.lastSync}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSync} disabled={isSyncing} fullWidth variant="primary">
                 {isSyncing ? (
                  <div className="flex items-center gap-2">
                    <Icons.Loader2 className="animate-spin" size={18} /> Syncing...
                  </div>
                ) : (
                  'Sync Now'
                )}
              </Button>
              <Button onClick={handleDisconnect} variant="secondary">
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Icons.Sparkles size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Configuration</h3>
            <p className="text-sm text-gray-500">Powered by Gemini 2.5 Flash</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          The app uses your environment API key to intelligently parse natural language inputs into structured transaction data.
        </p>
      </div>
    </div>
  );
};