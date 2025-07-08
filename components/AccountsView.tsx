import React, { useState, useMemo } from 'react';
import type { PayableReceivable, Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { PlusIcon, EditIcon, DeleteIcon, ClipboardListIcon } from './icons';

interface AccountsViewProps {
  accounts: PayableReceivable[];
  currency: Currency;
  onAdd: () => void;
  onEdit: (account: PayableReceivable) => void;
  onDelete: (account: PayableReceivable) => void;
  onToggleStatus: (accountId: string, newStatus: 'paid' | 'pending') => void;
}

const AccountCard: React.FC<{ account: PayableReceivable; currencyFormatter: Intl.NumberFormat; onEdit: () => void; onDelete: () => void; onToggleStatus: () => void; }> = ({ account, currencyFormatter, onEdit, onDelete, onToggleStatus }) => {
    const isOverdue = account.status === 'pending' && new Date(account.dueDate) < new Date();
    const isReceivable = account.type === 'receivable';

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg border-l-4 ${isReceivable ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex justify-between items-start">
                 <div className="flex-grow min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{account.description}</p>
                    {account.clientOrSupplier && <p className="text-sm text-slate-500 dark:text-slate-400">{account.clientOrSupplier}</p>}
                </div>
                 <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={onEdit} className="p-1 text-slate-400 hover:text-primary-500"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><DeleteIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="mt-2 flex items-end justify-between">
                <div>
                    <p className={`font-semibold text-lg ${isReceivable ? 'text-green-600' : 'text-red-600'}`}>
                        {currencyFormatter.format(account.amount)}
                    </p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-yellow-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        Vence em: {new Date(account.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                    </p>
                </div>
                <button 
                    onClick={onToggleStatus}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                        account.status === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200 hover:bg-slate-300'
                    }`}
                >
                    {account.status === 'paid' ? 'Pago' : 'Marcar como Pago'}
                </button>
            </div>
        </div>
    );
};

export const AccountsView: React.FC<AccountsViewProps> = ({ accounts, currency, onAdd, onEdit, onDelete, onToggleStatus }) => {
    const currencyFormatter = getCurrencyFormatter(currency);
    const [filterType, setFilterType] = useState<'all' | 'payable' | 'receivable'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');


    const { pendingPayable, pendingReceivable } = useMemo(() => {
        return accounts.reduce((acc, a) => {
            if(a.status === 'pending') {
              if (a.type === 'payable') {
                  acc.pendingPayable += a.amount;
              } else {
                  acc.pendingReceivable += a.amount;
              }
            }
            return acc;
        }, { pendingPayable: 0, pendingReceivable: 0 });
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        return accounts
            .filter(a => {
                const typeMatch = filterType === 'all' || a.type === filterType;
                const statusMatch = filterStatus === 'all' || a.status === filterStatus;
                const dueDate = new Date(a.dueDate);
                const startMatch = !startDate || dueDate >= new Date(startDate);
                const endMatch = !endDate || dueDate <= new Date(endDate + 'T23:59:59');
                return typeMatch && statusMatch && startMatch && endMatch;
            })
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .sort((a,b) => (a.status === 'paid' ? 1 : -1) - (b.status === 'paid' ? 1: -1)); // show pending first
    }, [accounts, filterType, filterStatus, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Contas a Pagar e Receber</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                    <div>
                        <p className="text-sm text-red-500">Pendente a Pagar</p>
                        <p className="font-bold text-lg text-red-600">{currencyFormatter.format(pendingPayable)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-green-500">Pendente a Receber</p>
                        <p className="font-bold text-lg text-green-600">{currencyFormatter.format(pendingReceivable)}</p>
                    </div>
                </div>
            </div>
             <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 transition">
                <PlusIcon className="w-5 h-5" /> Nova Conta
            </button>
        </div>
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todas (Tipo)</option>
                <option value="payable">A Pagar</option>
                <option value="receivable">A Receber</option>
            </select>
             <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                <option value="all">Todas (Status)</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagas</option>
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" placeholder="Vencimento Início"/>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" placeholder="Vencimento Fim"/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAccounts.map((account) => (
            <AccountCard key={account.id} account={account} currencyFormatter={currencyFormatter} onEdit={() => onEdit(account)} onDelete={() => onDelete(account)} onToggleStatus={() => onToggleStatus(account.id, account.status === 'pending' ? 'paid' : 'pending')} />
        ))}
      </div>

       {filteredAccounts.length === 0 && (
            <div className="text-center col-span-full py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                <ClipboardListIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="font-semibold">Nenhuma conta encontrada com os filtros selecionados.</p>
                <p>Ajuste os filtros ou adicione novas contas.</p>
            </div>
        )}
    </div>
  );
};