import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Icons } from '../components/ui/Icons';
import { getDriveConfig, saveDriveConfig, getCategories, saveCategory, deleteCategory, overwriteData } from '../services/storageService';
import { driveService } from '../services/driveService';
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
    clientId: '',
    fileName: 'expense_tracker_db.json'
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const handleLogin = async () => {
    if (!driveConfig.clientId) {
      setAuthError("Please enter a Client ID");
      return;
    }
    setAuthError(null);

    try {
      // 1. Init GAPI
      await driveService.initGapi(driveConfig.clientId);
      
      // 2. Init GIS and Trigger Login
      driveService.initGis(driveConfig.clientId, async (tokenResponse) => {
         if (tokenResponse && tokenResponse.access_token) {
            handleDriveConfigChange('isConnected', true);
            
            // 3. Attempt to load existing data from Drive immediately
            await handlePullFromDrive();
         }
      });
      
      driveService.login();

    } catch (err: any) {
      console.error("Login failed", err);
      setAuthError(err.message || "Failed to initialize Google Login");
    }
  };

  const handlePullFromDrive = async () => {
      setIsSyncing(true);
      try {
          const fileName = driveConfig.fileName.endsWith('.json') ? driveConfig.fileName : `${driveConfig.fileName.split('.')[0]}.json`;
          const fileId = await driveService.findFile(fileName);
          
          if (fileId) {
             const data = await driveService.readFile(fileId);
             if (data && data.transactions) {
                 overwriteData(data.transactions, data.categories || []);
                 setCategories(data.categories || []); // update local UI state
                 handleDriveConfigChange('fileId', fileId);
                 handleDriveConfigChange('lastSync', new Date().toLocaleString());
                 alert("Data successfully loaded from Drive!");
             }
          } else {
             console.log("File not found on Drive, will be created on next save.");
          }
      } catch (e) {
          console.error("Pull failed", e);
          setAuthError("Failed to read from Drive. Check permissions.");
      } finally {
          setIsSyncing(false);
      }
  };

  const handleLogout = () => {
    const google = window.google;
    if (google) {
        google.accounts.oauth2.revoke(
            // We don't store access token in persistent state for security, 
            // but normally we'd pass it here. 
            // Simplified: just reset local state.
            '', 
            () => {}
        );
    }
    handleDriveConfigChange('isConnected', false);
    handleDriveConfigChange('lastSync', undefined);
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

      {/* Google Drive Database Configuration */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-full ${driveConfig.isConnected ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            <Icons.Download size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Google Drive Database</h3>
            <p className="text-sm text-gray-500">
              {driveConfig.isConnected ? 'Connected & Syncing' : 'Sync data to personal Drive'}
            </p>
          </div>
        </div>

        {!driveConfig.isConnected ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
               <p className="font-semibold mb-1">Setup Required:</p>
               <ol className="list-decimal list-inside space-y-1">
                 <li>Create a Project in Google Cloud Console.</li>
                 <li>Enable <strong>Google Drive API</strong>.</li>
                 <li>Create <strong>OAuth Client ID</strong> (Web Application).</li>
                 <li>Add this URL to <strong>Authorized JavaScript origins</strong>.</li>
               </ol>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Google Client ID</label>
               <input
                 type="text"
                 value={driveConfig.clientId}
                 onChange={(e) => handleDriveConfigChange('clientId', e.target.value)}
                 className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                 placeholder="e.g., 12345-abcde.apps.googleusercontent.com"
               />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Database Filename</label>
              <input 
                type="text" 
                value={driveConfig.fileName}
                onChange={(e) => handleDriveConfigChange('fileName', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="expense_tracker_db.json"
              />
            </div>

            {authError && <p className="text-sm text-red-500">{authError}</p>}

            <div className="pt-2">
              <Button onClick={handleLogin} fullWidth variant="primary">
                  Login with Google
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Status: Connected</span>
                <span className="text-xs text-green-600 bg-white px-2 py-1 rounded-full border border-green-200">
                  Online
                </span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>File: <span className="font-semibold">{driveConfig.fileName}</span></p>
                {driveConfig.lastSync && (
                  <p className="text-xs opacity-75 mt-2 pt-2 border-t border-green-200">
                    Last synced: {driveConfig.lastSync}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
               <Button onClick={handlePullFromDrive} disabled={isSyncing} fullWidth variant="primary">
                 {isSyncing ? (
                  <div className="flex items-center gap-2">
                    <Icons.Loader2 className="animate-spin" size={18} /> Pulling Data...
                  </div>
                ) : (
                  'Force Pull Data'
                )}
              </Button>
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">Changes are automatically saved to Drive.</p>
          </div>
        )}
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
    </div>
  );
};