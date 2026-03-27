import { useState } from 'react';
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
import { WalletIcon, ReceiptIcon, SettingsIcon, ChartPieIcon } from './shared/components/Icons';

export default function App() {
  const pinHash = useBudgetStore((s) => s.pinHash);
  const [isLocked, setIsLocked] = useState(() => !!useBudgetStore.getState().pinHash);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [fabOpen, setFabOpen] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);

  function navigate(s: Screen, txId?: string) {
    setFabOpen(false);
    setEditTransactionId(txId ?? null);
    setScreen(s);
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
        {screen === 'add-expense' && <AddExpense onNavigate={navigate} />}
        {screen === 'add-income' && <AddIncome onNavigate={navigate} />}
        {screen === 'summary' && <Summary onNavigate={navigate} />}
        {screen === 'settings' && <Settings onNavigate={navigate} />}
        {screen === 'edit-expense' && editTransactionId && <EditExpense onNavigate={navigate} transactionId={editTransactionId} />}
        {screen === 'edit-income' && editTransactionId && <EditIncome onNavigate={navigate} transactionId={editTransactionId} />}
        {screen === 'analytics' && <Analytics onNavigate={navigate} />}
        {screen === 'recurring' && <RecurringManage onNavigate={navigate} />}
      </div>

      <InstallPrompt />

      {/* Bottom navigation - shown on main tab screens, hidden when locked */}
      {!isLocked && (['dashboard', 'summary', 'analytics', 'settings'] as const).includes(screen as any) && (
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

              {/* Summary */}
              <button
                onClick={() => navigate('summary')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'summary' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[10px] font-medium">Summary</span>
              </button>

              {/* FAB */}
              <button
                onClick={() => setFabOpen(!fabOpen)}
                className={`-mt-8 mx-auto w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  fabOpen
                    ? 'bg-slate-600 rotate-45'
                    : 'bg-emerald-500'
                }`}
              >
                <svg className="w-7 h-7 text-white transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Analytics */}
              <button
                onClick={() => navigate('analytics')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'analytics' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <ChartPieIcon size={24} />
                <span className="text-[10px] font-medium">Analytics</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => navigate('settings')}
                className={`flex flex-col items-center gap-0.5 ${screen === 'settings' ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                <SettingsIcon size={24} />
                <span className="text-[10px] font-medium">Settings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
