import React, { useState, useMemo } from 'react';
import type { Transaction, Currency } from '../types';
import { ALL_CATEGORIES } from '../constants';
import { exportTransactionsToExcel, exportTransactionsToPDF } from '../services/exportService';
import { DownloadIcon, EditIcon, DeleteIcon } from './icons';
import { getCurrencyFormatter } from '../utils/formatters';

interface CashFlowViewProps {
    transactions: Transaction[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => void;
    currency: Currency;
}

const TransactionCard: React.FC<{transaction: Transaction, currencyFormatter: Intl.NumberFormat, onEdit: () => void, onDelete: () => void}> = ({transaction: t, currencyFormatter, onEdit, onDelete}) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex items-center gap-4">
        <div className={`w-2 h-full rounded-full ${t.type === 'revenue' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <div className="flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.description}</p>
                    {t.clientOrSupplier && <p className="text-sm text-slate-500 dark:text-slate-400">{t.clientOrSupplier}</p>}
                </div>
                <p className={`font-bold text-lg ${t.type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'revenue' ? '+' : '-'} {currencyFormatter.format(t.amount)}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 mt-1">
                 <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {t.category}
                </span>
                <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
        <div className="flex flex-col gap-2">
            <button onClick={onEdit} className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors" aria-label="Editar">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" aria-label="Excluir">
                <DeleteIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
)

export const CashFlowView: React.FC<CashFlowViewProps> = ({ transactions, onEdit, onDelete, currency }) => {
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const currencyFormatter = getCurrencyFormatter(currency);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = filterType === 'all' || t.type === filterType;
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      const transactionDate = new Date(t.date);
      const startMatch = !startDate || transactionDate >= new Date(startDate);
      const endMatch = !endDate || transactionDate <= new Date(endDate + 'T23:59:59');
      return typeMatch && categoryMatch && startMatch && endMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCategory, startDate, endDate]);

  const handleExportExcel = () => {
    exportTransactionsToExcel(filteredTransactions, "fluxo_de_caixa");
  };

  const handleExportPDF = () => {
    exportTransactionsToPDF(filteredTransactions, currency);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div/>
        <div className="flex items-center gap-2">
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition">
                <DownloadIcon className="w-5 h-5" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition">
                <DownloadIcon className="w-5 h-5" /> PDF
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
            <option value="all">Todos os Lançamentos</option>
            <option value="revenue">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
            <option value="all">Todas as Categorias</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" placeholder="Data Início"/>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" placeholder="Data Fim"/>
        </div>
      </div>

      {/* Mobile view: Cards */}
      <div className="md:hidden space-y-4">
        {filteredTransactions.map(t => (
          <TransactionCard 
            key={t.id} 
            transaction={t} 
            currencyFormatter={currencyFormatter}
            onEdit={() => onEdit(t)}
            onDelete={() => onDelete(t)}
          />
        ))}
      </div>
      
      {/* Desktop view: Table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="p-4 font-semibold">Descrição</th>
              <th className="p-4 font-semibold">Valor</th>
              <th className="p-4 font-semibold">Categoria</th>
              <th className="p-4 font-semibold">Data</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-4">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{t.description}</p>
                  {t.clientOrSupplier && <p className="text-sm text-slate-500 dark:text-slate-400">{t.clientOrSupplier}</p>}
                </td>
                <td className={`p-4 font-semibold ${t.type === 'revenue' ? 'text-green-500' : 'text-red-500'}`}>
                   {t.type === 'revenue' ? '+' : '-'} {currencyFormatter.format(t.amount)}
                </td>
                <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {t.category}
                    </span>
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400">
                  {new Date(t.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                        <button onClick={() => onEdit(t)} className="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors" aria-label="Editar">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => onDelete(t)} className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors" aria-label="Excluir">
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredTransactions.length === 0 && (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">Nenhum lançamento encontrado com os filtros selecionados.</div>
      )}
    </div>
  );
};