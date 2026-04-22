import { useState } from 'react';
import { useBudgetStore } from '../../shared/store/useBudgetStore';
import { getCycleForDate } from '../../shared/utils/cycle';
import { formatMoney } from '../../shared/utils/format';
import type { Screen } from '../../shared/types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function MonthlyReport({ onNavigate: _onNavigate }: { onNavigate: (s: Screen) => void }) {
  const store = useBudgetStore();
  const sym = store.currencySymbol;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  // Build the two cycles for this month
  const pad = (n: number) => String(n).padStart(2, '0');
  const firstHalf = getCycleForDate(`${year}-${pad(month + 1)}-01`);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const secondHalf = getCycleForDate(`${year}-${pad(month + 1)}-${pad(lastDay)}`);

  // Combine data from both cycles
  const txns1 = store.getTransactionsForCycle(firstHalf);
  const txns2 = firstHalf.startDate !== secondHalf.startDate ? store.getTransactionsForCycle(secondHalf) : [];
  const allTxns = [...txns1, ...txns2];

  const totalIncome = allTxns.filter((t) => t.type === 'income' && !t.transferId).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = allTxns.filter((t) => t.type === 'expense' && !t.transferId).reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0;
  const txnCount = allTxns.filter((t) => !t.transferId).length;

  // Category breakdown
  const byCategory: Record<string, number> = {};
  for (const t of allTxns.filter((t) => t.type === 'expense' && !t.transferId)) {
    const cat = t.category ?? 'Other';
    byCategory[cat] = (byCategory[cat] ?? 0) + t.amount;
  }
  const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  // Bills for the month
  const startDay1 = parseInt(firstHalf.startDate.split('-')[2]);
  const endDay1 = parseInt(firstHalf.endDate.split('-')[2]);
  const startDay2 = parseInt(secondHalf.startDate.split('-')[2]);
  const endDay2 = parseInt(secondHalf.endDate.split('-')[2]);

  const bills1 = store.billTemplates.filter((b) =>
    b.enabled && b.dueDay >= startDay1 && b.dueDay <= endDay1 &&
    (!b.createdInCycle || b.createdInCycle <= firstHalf.startDate) &&
    (!b.oneTimeCycle || b.oneTimeCycle === firstHalf.startDate)
  );
  const bills2 = firstHalf.startDate !== secondHalf.startDate
    ? store.billTemplates.filter((b) =>
        b.enabled && b.dueDay >= startDay2 && b.dueDay <= endDay2 &&
        (!b.createdInCycle || b.createdInCycle <= secondHalf.startDate) &&
        (!b.oneTimeCycle || b.oneTimeCycle === secondHalf.startDate)
      )
    : [];
  const totalBills = bills1.length + bills2.length;
  const billsPaid1 = store.getBillPaymentsForCycle(firstHalf.startDate);
  const billsPaid2 = store.getBillPaymentsForCycle(secondHalf.startDate);
  const totalBillsPaid = bills1.filter((b) => billsPaid1.some((p) => p.billId === b.id)).length
    + bills2.filter((b) => billsPaid2.some((p) => p.billId === b.id)).length;
  const totalBillAmount = [...bills1, ...bills2].reduce((s, b) => s + b.amount, 0);

  // Needs vs wants
  const needs = allTxns.filter((t) => t.type === 'expense' && !t.transferId && t.tag === 'needs').reduce((s, t) => s + t.amount, 0);
  const wants = allTxns.filter((t) => t.type === 'expense' && !t.transferId && t.tag === 'wants').reduce((s, t) => s + t.amount, 0);

  // Navigate month
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  const CATEGORY_COLORS = ['#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#A78BFA', '#FB923C', '#2DD4BF', '#F87171'];

  return (
    <div className="flex flex-col gap-3 px-5 pt-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 active:bg-slate-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-base font-semibold text-white">{MONTHS[month]} {year}</p>
          <p className="text-[10px] text-slate-500">{firstHalf.label} + {secondHalf.label}</p>
        </div>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 active:bg-slate-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Overview card */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <p className="text-3xl font-bold text-center mb-1" style={{ color: totalBalance >= 0 ? '#34D399' : '#F87171' }}>
          {totalBalance >= 0 ? '' : '−'}{formatMoney(Math.abs(totalBalance), sym)}
        </p>
        <p className="text-[10px] text-slate-500 text-center mb-3">Net balance</p>

        <div className="flex justify-between pt-3 border-t border-slate-800">
          <div>
            <p className="text-[10px] text-slate-500">Income</p>
            <p className="text-sm font-bold text-emerald-400">+{formatMoney(totalIncome, sym)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500">Expenses</p>
            <p className="text-sm font-bold text-red-400">−{formatMoney(totalExpenses, sym)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Saved</p>
            <p className={`text-sm font-bold ${savingsRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{txnCount}</p>
          <p className="text-[9px] text-slate-500">Transactions</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{totalBillsPaid}/{totalBills}</p>
          <p className="text-[9px] text-slate-500">Bills Paid</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{formatMoney(totalBillAmount, sym)}</p>
          <p className="text-[9px] text-slate-500">Bill Total</p>
        </div>
      </div>

      {/* Needs vs Wants */}
      {(needs > 0 || wants > 0) && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Needs vs Wants</p>
          <div className="flex gap-2 h-3 rounded-full overflow-hidden bg-slate-800">
            {needs > 0 && (
              <div className="bg-blue-500 rounded-full transition-all" style={{ width: `${(needs / (needs + wants)) * 100}%` }} />
            )}
            {wants > 0 && (
              <div className="bg-purple-500 rounded-full transition-all" style={{ width: `${(wants / (needs + wants)) * 100}%` }} />
            )}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-blue-400">Needs {formatMoney(needs, sym)}</span>
            <span className="text-xs text-purple-400">Wants {formatMoney(wants, sym)}</span>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">By Category</p>
          <div className="space-y-2">
            {sortedCategories.map(([cat, total], i) => {
              const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-300">{cat}</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {formatMoney(total, sym)} <span className="text-[10px] text-slate-500">({pct.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {txnCount === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">No data for this month</p>
          <p className="text-slate-500 text-xs mt-1">Navigate to a month with transactions</p>
        </div>
      )}
    </div>
  );
}
