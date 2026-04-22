import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { ClipboardCheckIcon } from '../../shared/components/Icons';
import { getCurrentCycle, getRecentCycles } from '../../shared/utils/cycle';
import { forecastCycleSpending, detectSpendingAnomalies, calculateHealthScore } from '../../shared/utils/smart';

const CATEGORY_COLORS = ['#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF', '#F87171', '#818CF8', '#4ADE80'];
import { formatMoney } from '../../shared/utils/format';
import { getCategoryIconName } from '../../shared/utils/categories';
import { CategoryIcon, EmptyWalletIcon, SavingsIconComponent } from '../../shared/components/Icons';
import { BudgetProgress } from '../../shared/components/BudgetProgress';
import { Card } from '../../shared/components/Card';
import { SectionLabel } from '../../shared/components/SectionLabel';
import { EmptyState } from '../../shared/components/EmptyState';
import { RecurringPrompt } from '../recurring/RecurringPrompt';
import { PaydayCountdown } from './PaydayCountdown';
import { AccountsOverview } from './AccountsOverview';
import { WeekChart } from './WeekChart';
import { TodaySpending } from './TodaySpending';
import { UpcomingBills } from './UpcomingBills';
import { UpcomingSection } from './UpcomingSection';
import { BudgetProgressCards } from './BudgetProgressCards';
import type { Screen } from '../../shared/types';

export function Dashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const customCategories = store.customCategories;
  const sym = store.currencySymbol;
  const cycle = getCurrentCycle();
  const income = store.getTotalIncome(cycle);
  const expenses = store.getTotalExpenses(cycle);
  const balance = store.getBalance(cycle);
  const byCategory = store.getExpensesByCategory(cycle);
  const categoryBudgets = store.categoryBudgets;
  const isOverBudget = balance < 0;

  const recentTxns = store
    .getTransactionsForCycle(cycle)
    .sort((a, b) => {
      const aTime = a.createdAt ?? a.date;
      const bTime = b.createdAt ?? b.date;
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5);

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

  const totalSaved = store.savingsGoals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = store.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const healthScore = calculateHealthScore({
    income, expenses, billsPaid, billsTotal,
    totalSaved, totalTarget,
  });

  const forecast = forecastCycleSpending(store.transactions, cycle);
  const previousCycles = getRecentCycles(4).slice(0, 3);
  const cycleElapsedPct = forecast ? forecast.daysElapsed / forecast.totalDays : 0;
  const anomalies = cycleElapsedPct >= 0.5
    ? detectSpendingAnomalies(store.transactions, cycle, previousCycles)
    : [];
  const expectedIncome = Math.max(income, store.expectedSalary);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const tips: string[] = [];
  if (forecast) {
    const pctCycle = forecast.daysElapsed / forecast.totalDays;
    const pctSpent = expectedIncome > 0 ? expenses / expectedIncome : 0;
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
  const overBudgetCats = Object.entries(byCategory).filter(([cat, spent]) => {
    const budget = categoryBudgets.find((b) => b.category === cat);
    return budget && spent > budget.limit;
  });
  if (overBudgetCats.length > 0) tips.unshift(`${overBudgetCats[0][0]} is over budget!`);
  if (tips.length === 0) tips.push("Track your expenses daily — small habits lead to big savings!");
  const tip = tips[0];

  const unpurchasedWishlist = store.wishlistItems.filter((i) => !i.purchased);

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <RecurringPrompt />

      {/* === HERO: Greeting + Balance + Income/Expenses === */}
      <Card size="lg" className="animate-reveal-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">{greeting}!</h2>
            <p className="text-xs text-slate-500">{cycle.label}</p>
          </div>
          {income > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="relative w-11 h-11">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#1e293b" strokeWidth="3.5" />
                  <circle cx="22" cy="22" r="18" fill="none" stroke={healthScore.color} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${(healthScore.score / 100) * 113.1} 113.1`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-white">{healthScore.score}</span>
                </div>
              </div>
              <span className="text-[10px] font-medium" style={{ color: healthScore.color }}>{healthScore.label}</span>
            </div>
          )}
        </div>

        <p className={`text-[2.25rem] font-bold tracking-tight text-center ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
          {isOverBudget && '−'}{formatMoney(Math.abs(balance), sym)}
        </p>
        <p className="text-xs text-slate-500 text-center mt-1">
          {isOverBudget ? 'Over this cycle' : 'Saved this cycle'}
        </p>

        <div className="flex justify-between mt-4 pt-3 border-t border-slate-800">
          <div>
            <SectionLabel>Income</SectionLabel>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">+{formatMoney(income, sym)}</p>
          </div>
          <div className="text-right">
            <SectionLabel>Expenses</SectionLabel>
            <p className="text-sm font-bold text-red-400 mt-0.5">−{formatMoney(expenses, sym)}</p>
          </div>
        </div>
      </Card>

      {/* === TIP === */}
      <p className="text-[11px] text-slate-400 flex items-start gap-1.5 px-1 animate-reveal-up" style={{ animationDelay: '60ms' }}>
        <svg className="w-4 h-4 text-amber-400 shrink-0 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
        {tip}
      </p>

      {/* === ACCOUNTS OVERVIEW === */}
      <div className="animate-reveal-up empty:hidden" style={{ animationDelay: '75ms' }}>
        <AccountsOverview onNavigate={onNavigate} />
      </div>

      {/* === PAYDAY COUNTDOWN === */}
      <div className="animate-reveal-up" style={{ animationDelay: '90ms' }}>
        <PaydayCountdown />
      </div>

      {/* === TODAY SPENDING + WEEK CHART === */}
      <div className="grid grid-cols-2 gap-2 animate-reveal-up" style={{ animationDelay: '120ms' }}>
        <TodaySpending />
        <WeekChart />
      </div>

      {/* === SMART INSIGHTS === */}
      {(forecast || anomalies.length > 0) && (
        <Card size="md" ring ringColor="ring-amber-500/20" className="animate-reveal-up" style={{ animationDelay: '180ms' }}>
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <SectionLabel>Smart Insights</SectionLabel>
          </div>
          <div className="space-y-2">
            {forecast && (
              <p className="text-xs text-slate-300">
                At {formatMoney(forecast.dailyAvg, sym)}/day, projected{' '}
                <span className="font-semibold text-white">{formatMoney(forecast.projected, sym)}</span>.
                {expectedIncome > 0 && forecast.projected > expectedIncome && <span className="text-red-400"> {formatMoney(forecast.projected - expectedIncome, sym)} over.</span>}
                {expectedIncome > 0 && forecast.projected <= expectedIncome && <span className="text-emerald-400"> Save {formatMoney(expectedIncome - forecast.projected, sym)}.</span>}
              </p>
            )}
            {anomalies.slice(0, 2).map((a) => (
              <p key={a.category} className="text-xs text-slate-300">
                <span className="text-white font-medium">{a.category}</span>{' '}
                <span className="text-amber-400">+{a.pctIncrease.toFixed(0)}%</span> vs usual ({formatMoney(a.current, sym)} vs {formatMoney(a.average, sym)})
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* === QUICK ACCESS: Bills / Savings / Wishlist === */}
      <div className="grid grid-cols-3 gap-2 animate-reveal-up empty:hidden" style={{ animationDelay: '240ms' }}>
        {billsTotal > 0 && (
          <Card size="sm" onClick={() => onNavigate('bills')}>
            <ClipboardCheckIcon size={16} className="text-slate-400 mb-1.5" />
            <p className="text-[10px] text-slate-500">Bills</p>
            <p className="text-xs font-bold text-white">{billsPaid}/{billsTotal}</p>
          </Card>
        )}
        {store.savingsGoals.length > 0 && (
          <Card size="sm" onClick={() => onNavigate('savings')}>
            <SavingsIconComponent name="PiggyBank" size={16} className="text-slate-400 mb-1.5" />
            <p className="text-[10px] text-slate-500">Saved</p>
            <p className="text-xs font-bold text-emerald-400">{formatMoney(totalSaved, sym)}</p>
          </Card>
        )}
        {unpurchasedWishlist.length > 0 && (
          <Card size="sm" onClick={() => onNavigate('wishlist')}>
            <svg className="w-4 h-4 text-slate-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <p className="text-[10px] text-slate-500">Wishlist</p>
            <p className="text-xs font-bold text-white">{unpurchasedWishlist.length} item{unpurchasedWishlist.length !== 1 ? 's' : ''}</p>
          </Card>
        )}
      </div>

      {/* === UPCOMING BILLS === */}
      <div className="animate-reveal-up empty:hidden" style={{ animationDelay: '280ms' }}>
        <UpcomingBills onNavigate={onNavigate} />
      </div>

      {/* === UPCOMING SECTION === */}
      <div className="animate-reveal-up empty:hidden" style={{ animationDelay: '320ms' }}>
        <UpcomingSection />
      </div>

      {/* === BUDGET PROGRESS CARDS === */}
      <div className="animate-reveal-up empty:hidden" style={{ animationDelay: '360ms' }}>
        <BudgetProgressCards />
      </div>

      {/* === CATEGORIES === */}
      {Object.keys(byCategory).length > 0 && (
        <Card className="animate-reveal-up" style={{ animationDelay: '400ms' }}>
          <SectionLabel className="mb-3">Expenses by Category</SectionLabel>
          <div className="space-y-2.5">
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
        </Card>
      )}

      {/* === RECENT TRANSACTIONS === */}
      {recentTxns.length > 0 && (
        <div className="animate-reveal-up" style={{ animationDelay: '440ms' }}>
          <SectionLabel className="mb-2" action={
            <button onClick={() => onNavigate('summary')} className="text-xs text-emerald-400 font-medium">View all</button>
          }>
            Recent
          </SectionLabel>
          <Card size="sm" className="!p-0 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {recentTxns.map((t) => {
                const isTransfer = !!t.transferId;
                return (
                  <div key={t.id} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isTransfer
                          ? 'bg-blue-500/15 text-blue-400'
                          : t.type === 'income' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {isTransfer ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        ) : t.type === 'income' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7 7-7 7 7" /></svg>
                        ) : (
                          <CategoryIcon name={getCategoryIconName(t.category ?? 'Other', customCategories)} size={14} />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-200">{isTransfer ? 'Transfer' : t.type === 'income' ? t.source ?? 'Income' : t.category ?? 'Other'}</p>
                        {t.note && <p className="text-[10px] text-slate-500">{t.note}</p>}
                      </div>
                    </div>
                    <p className={`text-xs font-bold ${
                      isTransfer ? 'text-slate-300' : t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {isTransfer ? '' : t.type === 'income' ? '+' : '−'}{formatMoney(t.amount, sym)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* === EMPTY STATE === */}
      {recentTxns.length === 0 && income === 0 && (
        <EmptyState
          icon={<EmptyWalletIcon size={32} className="text-slate-500" />}
          title="No transactions yet"
          description="Tap + to get started"
        />
      )}
    </div>
  );
}
