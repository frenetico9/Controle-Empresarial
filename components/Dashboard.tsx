import React, { useMemo } from 'react';
import type { Transaction, PayableReceivable, Currency } from '../types';
import { StatCard } from './StatCard';
import { CategoryPieChart } from './CategoryPieChart';
import { BalanceTrendChart } from './BalanceTrendChart';
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, ProfitIcon, ClipboardListIcon, TrendingUpIcon, ScaleIcon, ChartPieIcon } from './icons';
import { getCurrencyFormatter } from '../utils/formatters';

interface DashboardProps {
  transactions: Transaction[];
  accounts: PayableReceivable[];
  financialSummary: {
      cashBalance: number;
      investmentsCurrentValue: number;
      remainingDebt: number;
      netWorth: number;
  };
  currency: Currency;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, accounts, financialSummary, currency }) => {
  const currencyFormatter = getCurrencyFormatter(currency);
  const { cashBalance, investmentsCurrentValue, remainingDebt, netWorth } = financialSummary;
  
  const { totalRevenue, totalExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.reduce(
      (acc, t) => {
        const transactionDate = new Date(t.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
          if (t.type === 'revenue') {
            acc.totalRevenue += t.amount;
          } else {
            acc.totalExpenses += t.amount;
          }
        }
        return acc;
      },
      { totalRevenue: 0, totalExpenses: 0 }
    );
  }, [transactions]);

  const upcomingAccounts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return [...accounts]
        .filter(a => a.status === 'pending' && new Date(a.dueDate) >= today)
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);
  }, [accounts]);

  const monthlyProfit = totalRevenue - totalExpenses;
  const totalAssets = cashBalance + investmentsCurrentValue;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Header Stat Cards */}
      <div className="lg:col-span-3 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Patrimônio Líquido"
            value={currencyFormatter.format(netWorth)}
            icon={<ChartPieIcon className="w-8 h-8 text-white" />}
            color="bg-primary-500"
            tooltip="Ativos (Caixa + Investimentos) - Passivos (Dívidas)"
          />
          <StatCard
            title="Total em Ativos"
            value={currencyFormatter.format(totalAssets)}
            icon={<ArrowUpIcon className="w-8 h-8 text-white" />}
            color="bg-green-500"
            tooltip={`Caixa: ${currencyFormatter.format(cashBalance)} + Invest.: ${currencyFormatter.format(investmentsCurrentValue)}`}
          />
          <StatCard
            title="Total em Dívidas"
            value={currencyFormatter.format(remainingDebt)}
            icon={<ScaleIcon className="w-8 h-8 text-white" />}
            color="bg-red-500"
            tooltip="Soma de todos os empréstimos e financiamentos pendentes."
          />
          <StatCard
            title="Lucro (Mês)"
            value={currencyFormatter.format(monthlyProfit)}
            icon={<ProfitIcon className="w-8 h-8 text-white" />}
            color="bg-indigo-500"
             tooltip={`Faturamento: ${currencyFormatter.format(totalRevenue)} - Custos: ${currencyFormatter.format(totalExpenses)}`}
          />
      </div>

      {/* Balance Trend */}
      <div className="lg:col-span-3 xl:col-span-4 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Resumo do Fluxo de Caixa</h3>
        <BalanceTrendChart transactions={transactions} currency={currency} timeframe={'6m'} />
      </div>

      {/* Expense Chart & Upcoming Bills */}
      <div className="lg:col-span-3 xl:col-span-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Despesas por Categoria</h3>
          <CategoryPieChart transactions={transactions} currency={currency} />
        </div>
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ClipboardListIcon className="w-6 h-6 text-orange-500" />
                <span>Próximos Vencimentos</span>
            </h3>
             {upcomingAccounts.length > 0 ? (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {upcomingAccounts.map(account => (
                        <li key={account.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className={`font-medium ${account.type === 'receivable' ? 'text-green-600' : 'text-red-600'}`}>{account.description}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Vence em {new Date(account.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                            </div>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {currencyFormatter.format(account.amount)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
                    <p className="font-semibold">Nenhuma conta a pagar ou receber nos próximos dias.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};