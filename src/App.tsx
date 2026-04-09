import { useState, useEffect } from 'react';
import type { Screen } from './shared/types';
import { useBudgetStore } from './shared/store/useBudgetStore';
import { Dashboard } from './features/dashboard/Dashboard';
import { AddExpense } from './features/transactions/AddExpense';
import { AddIncome } from './features/transactions/AddIncome';
import { Summary } from './features/summary/Summary';
import { Settings } from './features/settings/Settings';
import { EditExpense } from './features/transactions/EditExpense';
import { EditIncome } from './features/transactions/EditIncome';
import { RecurringManage } from './features/recurring/RecurringManage';
import { Analytics } from './features/analytics/Analytics';
import { LockScreen } from './features/security/LockScreen';
import { InstallPrompt } from './features/pwa/InstallPrompt';
import { Bills } from './features/bills/Bills';
import { Savings } from './features/savings/Savings';
import { Wishlist } from './features/wishlist/Wishlist';
import { WalletIcon, ReceiptIcon, ClipboardCheckIcon } from './shared/components/Icons';

export default function App() {
  const pinHash = useBudgetStore((s) => s.pinHash);
  const theme = useBudgetStore((s) => s.theme);
  const [isLocked, setIsLocked] = useState(() => !!useBudgetStore.getState().pinHash);
  const storedScreen = useBudgetStore((s) => s.currentScreen);
  const setCurrentScreen = useBudgetStore((s) => s.setCurrentScreen);
  const [fabOpen, setFabOpen] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('dashboard');
  // Edit screens need a transaction ID; fall back to dashboard on reload
  const screen = (storedScreen === 'edit-expense' || storedScreen === 'edit-income') && !editTransactionId
    ? 'dashboard'
    : storedScreen;

  // Sync persisted screen if we fell back
  useEffect(() => {
    if (screen !== storedScreen) setCurrentScreen(screen);
  }, [screen, storedScreen, setCurrentScreen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#000000' : '#FFFFFF'
    );
  }, [theme]);

  function navigate(s: Screen, txId?: string) {
    setFabOpen(false);
    // Track where we came from (only for main screens, not form screens)
    const formScreens: Screen[] = ['add-expense', 'add-income', 'edit-expense', 'edit-income'];
    if (!formScreens.includes(screen)) {
      setPreviousScreen(screen);
    }
    setEditTransactionId(txId ?? null);
    setCurrentScreen(s);
  }

  return (
    <div className="bg-slate-950 text-white min-h-dvh max-w-2xl mx-auto relative overflow-hidden">
      {/* Lock screen */}
      {isLocked && pinHash && (
        <LockScreen pinHash={pinHash} onUnlock={() => setIsLocked(false)} />
      )}

      {/* Screen content */}
      <div key={screen + (editTransactionId ?? '')} className="animate-fade-in">
        {screen === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {screen === 'add-expense' && <AddExpense onNavigate={navigate} returnScreen={previousScreen} />}
        {screen === 'add-income' && <AddIncome onNavigate={navigate} returnScreen={previousScreen} />}
        {screen === 'summary' && <Summary onNavigate={navigate} />}
        {screen === 'settings' && <Settings onNavigate={navigate} />}
        {screen === 'edit-expense' && editTransactionId && <EditExpense onNavigate={navigate} transactionId={editTransactionId} />}
        {screen === 'edit-income' && editTransactionId && <EditIncome onNavigate={navigate} transactionId={editTransactionId} />}
        {screen === 'analytics' && <Analytics onNavigate={navigate} />}
        {screen === 'recurring' && <RecurringManage onNavigate={navigate} />}
        {screen === 'bills' && <Bills onNavigate={navigate} />}
        {screen === 'savings' && <Savings onNavigate={navigate} />}
        {screen === 'wishlist' && <Wishlist onNavigate={navigate} />}
      </div>

      <InstallPrompt />

      {/* Bottom navigation - shown on main tab screens, hidden when locked */}
      {!isLocked && (['dashboard', 'bills', 'summary', 'savings', 'wishlist', 'analytics', 'settings'] as const).includes(screen as any) && (
        <>
          {/* FAB overlay */}
          {fabOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => setFabOpen(false)}
            />
          )}

          {/* FAB menu */}
          {fabOpen && (
            <div className="fixed bottom-24 inset-x-0 flex flex-col gap-3 items-center z-50">
              <button
                onClick={() => navigate('add-income')}
                className="bg-emerald-500 text-white pl-4 pr-5 py-3 rounded-2xl flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform animate-pop"
                style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}
              >
                <WalletIcon size={20} />
                <span className="text-sm font-semibold">Add Income</span>
              </button>
              <button
                onClick={() => navigate('add-expense')}
                className="bg-red-500 text-white pl-4 pr-5 py-3 rounded-2xl flex items-center gap-2 whitespace-nowrap active:scale-95 transition-transform animate-pop"
                style={{ animationFillMode: 'backwards' }}
              >
                <ReceiptIcon size={20} />
                <span className="text-sm font-semibold">Add Expense</span>
              </button>
            </div>
          )}

          {/* Bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-6 py-3 grid grid-cols-5 gap-6 items-center">
              {/* Home */}
              <button
                onClick={() => navigate('dashboard')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[10px] font-medium">Home</span>
              </button>

              {/* Bills */}
              <button
                onClick={() => navigate('bills')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'bills' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <ClipboardCheckIcon size={24} />
                <span className="text-[10px] font-medium">Bills</span>
              </button>

              {/* FAB */}
              <button
                onClick={() => setFabOpen(!fabOpen)}
                className={`-mt-8 mx-auto w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  fabOpen
                    ? 'bg-slate-500 rotate-45'
                    : 'bg-emerald-500'
                }`}
              >
                <svg className="w-7 h-7 text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Savings */}
              <button
                onClick={() => navigate('savings')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'savings' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
                <span className="text-[10px] font-medium">Savings</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => navigate('wishlist')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'wishlist' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <span className="text-[10px] font-medium">Wishlist</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
