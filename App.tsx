import React, { useState, useEffect } from 'react';
import { Dashboard } from './views/Dashboard.tsx';
import { AddTransaction } from './views/AddTransaction.tsx';
import { Settings } from './views/Settings.tsx';
import { Icons } from './components/ui/Icons.tsx';
import { Transaction } from './types.ts';
import { getTransactions, saveTransaction, deleteTransaction, getCurrency, saveCurrency, getDriveConfig } from './services/storageService.ts';
import { driveService } from './services/driveService.ts';

type View = 'dashboard' | 'add' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currency, setCurrency] = useState<string>('$');

  useEffect(() => {
    setTransactions(getTransactions());
    setCurrency(getCurrency());

    const config = getDriveConfig();
    if (config.clientId) {
      driveService.initGapi(config.clientId).catch(console.error);
    }
  }, []);

  const handleAddTransaction = (t: Transaction) => {
    const updated = saveTransaction(t);
    setTransactions(updated);
    setCurrentView('dashboard');
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    saveCurrency(newCurrency);
    setCurrency(newCurrency);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
        currentView === view ? 'text-primary scale-110' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={24} strokeWidth={currentView === view ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-gray-50 shadow-2xl overflow-hidden relative sm:border-x sm:border-gray-200">
      
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-5 pb-24 min-h-full">
          {currentView === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              onDelete={handleDeleteTransaction}
              onNavigateAdd={() => setCurrentView('add')} 
              currency={currency}
            />
          )}
          {currentView === 'add' && (
            <AddTransaction 
              onAdd={handleAddTransaction} 
              onCancel={() => setCurrentView('dashboard')}
              currency={currency}
            />
          )}
          {currentView === 'settings' && (
            <Settings 
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
            />
          )}
        </div>
      </main>

      <nav className="absolute bottom-0 left-0 w-full h-20 bg-white/90 border-t border-gray-100 flex items-center justify-around pb-4 px-2 z-50 backdrop-blur-md">
        <NavItem view="dashboard" icon={Icons.Home} label="Home" />
        
        <div className="relative -top-5">
          <button
            onClick={() => setCurrentView('add')}
            className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center text-white transform transition-transform active:scale-90 hover:bg-indigo-600"
          >
            <Icons.Plus size={28} />
          </button>
        </div>

        <NavItem view="settings" icon={Icons.Settings} label="Settings" />
      </nav>
    </div>
  );
}