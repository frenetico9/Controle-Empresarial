import React, { useMemo } from 'react';
import type { Investment, Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { PlusIcon, EditIcon, DeleteIcon, TrendingUpIcon } from './icons';

interface InvestmentViewProps {
  investments: Investment[];
  currency: Currency;
  onAdd: () => void;
  onEdit: (investment: Investment) => void;
  onDelete: (investment: Investment) => void;
}

const InvestmentCard: React.FC<{
  investment: Investment;
  currencyFormatter: Intl.NumberFormat;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ investment, currencyFormatter, onEdit, onDelete }) => {
  const isPositive = investment.performance >= 0;
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-grow min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{investment.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{investment.type}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-primary-500"><EditIcon className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><DeleteIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Valor Atual</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{currencyFormatter.format(investment.currentValue)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Quantidade</p>
          <p className="font-semibold text-slate-700 dark:text-slate-200">{investment.quantity}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-slate-500 dark:text-slate-400">Performance</p>
          <p className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '▲' : '▼'} {investment.performance.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export const InvestmentView: React.FC<InvestmentViewProps> = ({ investments, currency, onAdd, onEdit, onDelete }) => {
  const currencyFormatter = getCurrencyFormatter(currency);

  const summary = useMemo(() => {
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0);
    const totalPerformance = totalInvested > 0 ? ((totalCurrentValue / totalInvested) - 1) * 100 : 0;
    return { totalCurrentValue, totalInvested, totalPerformance };
  }, [investments]);
  
  const isPositiveOverall = summary.totalPerformance >= 0;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Carteira de Investimentos</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
              <div>
                <p className="text-sm text-slate-500">Valor Total da Carteira</p>
                <p className="font-bold text-lg text-primary-600">{currencyFormatter.format(summary.totalCurrentValue)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Performance Geral</p>
                <p className={`font-bold text-lg ${isPositiveOverall ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositiveOverall ? '▲' : '▼'} {summary.totalPerformance.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
          <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 transition">
            <PlusIcon className="w-5 h-5" /> Novo Ativo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {investments.map((inv) => (
          <InvestmentCard
            key={inv.id}
            investment={inv}
            currencyFormatter={currencyFormatter}
            onEdit={() => onEdit(inv)}
            onDelete={() => onDelete(inv)}
          />
        ))}
      </div>

      {investments.length === 0 && (
        <div className="text-center col-span-full py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
          <TrendingUpIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="font-semibold">Nenhum investimento registrado.</p>
          <p>Adicione os ativos da sua empresa para começar a acompanhar a performance.</p>
        </div>
      )}
    </div>
  );
};
