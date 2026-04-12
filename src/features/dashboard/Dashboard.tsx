import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { ClipboardCheckIcon } from '../../shared/components/Icons';
import { getCurrentCycle, getRecentCycles } from '../../shared/utils/cycle';
import { forecastCycleSpending, detectSpendingAnomalies, calculateHealthScore } from '../../shared/utils/smart';
import { getAchievements } from '../../shared/utils/achievements';

const CATEGORY_COLORS = ['#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF', '#F87171', '#818CF8', '#4ADE80'];
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, EmptyWalletIcon, SavingsIconComponent } from '../../shared/components/Icons';
import { BudgetProgress } from '../../shared/components/BudgetProgress';
import { RecurringPrompt } from '../recurring/RecurringPrompt';
import type { Screen } from '../../shared/types';

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const balance = store.getBalance(cycle);
  const byCategory = store.getExpensesByCategory(cycle);
  const categoryBudgets = store.categoryBudgets;
  const isOverBudget = balance < 0;

  // Recent transactions (last 5)
  const recentTxns = store
    .getTransactionsForCycle(cycle)
    .sort((a, b) => {
      const aTime = a.createdAt ?? a.date;
      const bTime = b.createdAt ?? b.date;
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5);

  // Bills summary for current cycle (with per-cycle overrides)
  const startDay = parseInt(cycle.startDate.split('-')[2]);
  const endDay = parseInt(cycle.endDate.split('-')[2]);
  const cycleBills = store.billTemplates
    .filter((b) => b.enabled && b.dueDay >= startDay && b.dueDay <= endDay && (!b.createdInCycle || b.createdInCycle <= cycle.startDate) && (!b.oneTimeCycle || b.oneTimeCycle === cycle.startDate))
    .map((b) => {
      const override = store.getBillOverride(b.id, cycle.startDate);
      if (!override) return b;
      return { ...b, amount: override.amount ?? b.amount };
    });
  const billPayments = store.getBillPaymentsForCycle(cycle.startDate);
  const billsPaid = cycleBills.filter((b) => billPayments.some((p) => p.billId === b.id)).length;
  const billsTotal = cycleBills.length;

  // Health score
  const totalSaved = store.savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = store.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const healthScore = calculateHealthScore({
    income, expenses, billsPaid, billsTotal,
    totalSaved, totalTarget,
  });

  // Smart insights
  const forecast = forecastCycleSpending(store.transactions, cycle);
  const previousCycles = getRecentCycles(4).slice(0, 3);
  const anomalies = detectSpendingAnomalies(store.transactions, cycle, previousCycles);

  // Achievements
  const achievements = getAchievements({
    transactions: store.transactions,
    savingsGoals: store.savingsGoals,
    savingsContributions: store.savingsContributions,
    billTemplates: store.billTemplates,
    billPayments: store.getBillPaymentsForCycle(cycle.startDate),
    cycle,
    income, expenses,
    billsPaid, billsTotal,
  });
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Contextual tip — pick the most relevant one
  const tips: string[] = [];
  if (true) {
    if (forecast) {
      const pctCycle = forecast.daysElapsed / forecast.totalDays;
      const pctSpent = income > 0 ? expenses / income : 0;
      if (pctSpent < pctCycle * 0.8) tips.push("You're spending below pace — great discipline this cycle!");
      else if (pctSpent > pctCycle * 1.2) tips.push('Spending is running ahead of pace — consider slowing down the rest of this cycle.');
    }
    if (income > 0 && expenses === 0) tips.push("No expenses logged yet — don't forget to track your spending!");
    if (billsTotal > 0 && billsPaid < billsTotal) tips.push(`You have ${billsTotal - billsPaid} unpaid bill${billsTotal - billsPaid > 1 ? 's' : ''} this cycle.`);
    if (billsTotal > 0 && billsPaid === billsTotal) tips.push('All bills paid this cycle!');
    if (balance > 0 && store.savingsGoals.length > 0) {
      const incomplete = store.savingsGoals.filter((g) => g.savedAmount < g.targetAmount);
      if (incomplete.length > 0) tips.push(`You have ${formatMoney(balance, sym)} left — consider putting some toward your savings goals.`);
    }
    if (anomalies.length > 0) tips.push(`${anomalies[0].category} spending is ${anomalies[0].pctIncrease.toFixed(0)}% higher than usual.`);
  }
  if (tips.length === 0) tips.push("Track your expenses daily — small habits lead to big savings!");
  const tip = tips[0];

  // Achievement icon renderer
  const AchIcon = ({ icon }: { icon: string }) => {
    const paths: Record<string, string> = {
      pencil: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z',
      list: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
      check: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'trending-down': 'M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898',
      coin: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      star: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    };
    const p = paths[icon];
    if (!p) return null;
    return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={p} /></svg>;
  };

  // Wishlist data
  const unpurchasedWishlist = store.wishlistItems.filter((i) => !i.purchased);

  return (
    <div className="flex flex-col gap-4 pb-28 px-4 pt-4">
      <RecurringPrompt />

      {/* === HERO: Greeting + Balance + Income/Expenses === */}
      <div className="bg-slate-900 rounded-2xl p-5">
        {/* Greeting + cycle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">{greeting}!</h2>
            <p className="text-xs text-slate-500">{cycle.label}</p>
          </div>
          {/* Mini health score */}
          {income > 0 && (
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="4" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={healthScore.color} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(healthScore.score / 100) * 125.7} 125.7`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{healthScore.score}</span>
              </div>
            </div>
          )}
        </div>

        {/* Balance */}
        <p className={`text-4xl font-bold tracking-tight text-center ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
          {isOverBudget && '−'}{formatMoney(Math.abs(balance), sym)}
        </p>
        <p className="text-xs text-slate-500 text-center mt-1">Remaining Balance</p>

        {/* Income / Expenses inline */}
        <div className="flex justify-between mt-4 pt-3 border-t border-slate-800">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Income</p>
            <p className="text-sm font-bold text-emerald-400">+{formatMoney(income, sym)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase">Expenses</p>
            <p className="text-sm font-bold text-red-400">−{formatMoney(expenses, sym)}</p>
          </div>
        </div>
      </div>

      {/* === TIP === */}
      <p className="text-[11px] text-slate-400 flex items-start gap-1.5 px-1">
        <svg className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        {tip}
      </p>

      {/* === SMART INSIGHTS === */}
      {(forecast || anomalies.length > 0) && (
        <div className="bg-slate-900 rounded-2xl p-4 ring-1 ring-amber-500/20">
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">Smart Insights</p>
          </div>
          <div className="space-y-2">
            {forecast && (
              <p className="text-xs text-slate-300">
                At {formatMoney(forecast.dailyAvg, sym)}/day, projected{' '}
                <span className="font-semibold text-white">{formatMoney(forecast.projected, sym)}</span>.
                {income > 0 && forecast.projected > income && <span className="text-red-400"> {formatMoney(forecast.projected - income, sym)} over.</span>}
                {income > 0 && forecast.projected <= income && <span className="text-emerald-400"> Save {formatMoney(income - forecast.projected, sym)}.</span>}
              </p>
            )}
            {anomalies.slice(0, 2).map((a) => (
              <p key={a.category} className="text-xs text-slate-300">
                <span className="text-white font-medium">{a.category}</span>{' '}
                <span className="text-amber-400">+{a.pctIncrease.toFixed(0)}%</span> vs usual ({formatMoney(a.current, sym)} vs {formatMoney(a.average, sym)})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* === QUICK ACCESS: Bills / Savings / Wishlist === */}
      <div className="grid grid-cols-3 gap-2">
        {billsTotal > 0 && (
          <button onClick={() => onNavigate('bills')} className="bg-slate-900 rounded-xl p-3 text-left active:bg-slate-800 transition-colors">
            <ClipboardCheckIcon size={16} className="text-slate-400 mb-1.5" />
            <p className="text-[10px] text-slate-500">Bills</p>
            <p className="text-xs font-bold text-white">{billsPaid}/{billsTotal}</p>
          </button>
        )}
        {store.savingsGoals.length > 0 && (
          <button onClick={() => onNavigate('savings')} className="bg-slate-900 rounded-xl p-3 text-left active:bg-slate-800 transition-colors">
            <SavingsIconComponent name="PiggyBank" size={16} className="text-slate-400 mb-1.5" />
            <p className="text-[10px] text-slate-500">Saved</p>
            <p className="text-xs font-bold text-emerald-400">{formatMoney(totalSaved, sym)}</p>
          </button>
        )}
        {unpurchasedWishlist.length > 0 && (
          <button onClick={() => onNavigate('wishlist')} className="bg-slate-900 rounded-xl p-3 text-left active:bg-slate-800 transition-colors">
            <svg className="w-4 h-4 text-slate-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <p className="text-[10px] text-slate-500">Wishlist</p>
            <p className="text-xs font-bold text-white">{unpurchasedWishlist.length} item{unpurchasedWishlist.length !== 1 ? 's' : ''}</p>
          </button>
        )}
      </div>

      {/* === ACHIEVEMENTS === */}
      {achievements.length > 0 && (() => {
        const permanent = achievements.filter((a) => a.type === 'permanent');
        const cycleBadges = achievements.filter((a) => a.type === 'cycle');
        const selected = achievements.find((a) => a.id === selectedAchievement);
        return (
          <div className="bg-slate-900 rounded-2xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">{unlockedCount}/{achievements.length} Achievements</p>

            {/* Permanent */}
            <div className="flex gap-2 mb-2">
              {permanent.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAchievement(selectedAchievement === a.id ? null : a.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    a.unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800/50 text-slate-700'
                  } ${selectedAchievement === a.id ? 'ring-2 ring-amber-400 scale-110' : ''}`}
                >
                  <AchIcon icon={a.icon} />
                </button>
              ))}
            </div>

            {/* Cycle */}
            <p className="text-[9px] text-slate-600 mb-1.5">This cycle</p>
            <div className="flex gap-2">
              {cycleBadges.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAchievement(selectedAchievement === a.id ? null : a.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    a.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/50 text-slate-700'
                  } ${selectedAchievement === a.id ? 'ring-2 ring-emerald-400 scale-110' : ''}`}
                >
                  <AchIcon icon={a.icon} />
                </button>
              ))}
            </div>

            {/* Selected tooltip */}
            {selected && (
              <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${selected.unlocked ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                <p className={`font-medium ${selected.unlocked ? 'text-white' : 'text-slate-500'}`}>{selected.name}</p>
                <p className="text-slate-500">{selected.description}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* === CATEGORIES === */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Expenses by Category</p>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total], i) => {
                const budget = categoryBudgets.find((b) => b.category === cat);
                const pct = expenses > 0 ? (total / expenses) * 100 : 0;
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 flex items-center gap-1.5">
                        <CategoryIcon name={getCategoryIconName(cat, customCategories)} size={16} style={{ color }} />
                        {cat}
                      </span>
                      <span className="text-sm font-semibold text-slate-200">{formatMoney(total, sym)}</span>
                    </div>
                    {budget ? (
                      <BudgetProgress spent={total} limit={budget.limit} symbol={sym} />
                    ) : (
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* === RECENT TRANSACTIONS === */}
      {recentTxns.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Recent</p>
            <button onClick={() => onNavigate('summary')} className="text-xs text-emerald-400 font-medium">View all</button>
          </div>
          <div className="bg-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {recentTxns.map((t) => (
              <div key={t.id} className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {t.type === 'income' ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" /></svg>
                    ) : (
                      <CategoryIcon name={getCategoryIconName(t.category ?? 'Other', customCategories)} size={14} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-200">{t.type === 'income' ? t.source ?? 'Income' : t.category ?? 'Other'}</p>
                    {t.note && <p className="text-[10px] text-slate-500">{t.note}</p>}
                  </div>
                </div>
                <p className={`text-xs font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount, sym)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === EMPTY STATE === */}
      {recentTxns.length === 0 && income === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-3">
            <EmptyWalletIcon size={32} className="text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">No transactions yet</p>
          <p className="text-slate-500 text-xs mt-1">Tap + to get started</p>
        </div>
      )}
    </div>
  );
}
