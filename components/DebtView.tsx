import React, { useMemo, useState } from 'react';
import type { Debt, Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { PlusIcon, EditIcon, DeleteIcon, ScaleIcon } from './icons';

interface DebtViewProps {
  debts: Debt[];
  currency: Currency;
  onAdd: () => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  onPayInstallment: (debtId: string, amount: number, date: string) => void;
}

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
      <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const PayInstallmentModal: React.FC<{
  debtName: string;
  onClose: () => void;
  onConfirm: (amount: number, date: string) => void;
}> = ({ debtName, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleConfirm = () => {
        const parsedAmount = parseFloat(amount);
        if(parsedAmount > 0 && date) {
            onConfirm(parsedAmount, date);
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pagar Parcela</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Registrar pagamento para "{debtName}"</p>
                    <div className="mt-4 space-y-4">
                         <div>
                            <label htmlFor="pay_amount" className="text-sm font-medium text-slate-600 dark:text-slate-300">Valor Pago</label>
                            <input id="pay_amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                        </div>
                         <div>
                            <label htmlFor="pay_date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data do Pagamento</label>
                            <input id="pay_date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">Cancelar</button>
                        <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Confirmar Pagamento</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const DebtCard: React.FC<{
  debt: Debt;
  currencyFormatter: Intl.NumberFormat;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}> = ({ debt, currencyFormatter, onEdit, onDelete, onPay }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-grow min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2">{debt.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{debt.lender || debt.type}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-primary-500"><EditIcon className="w-4 h-4" /></button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500"><DeleteIcon className="w-4 h-4" /></button>
        </div>
      </div>
      <ProgressBar value={debt.paidAmount} max={debt.totalAmount} />
      <div className="mt-3 flex items-end justify-between">
         <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Saldo Devedor</p>
            <p className="font-semibold text-lg text-red-500">{currencyFormatter.format(debt.remainingAmount)}</p>
         </div>
         <button onClick={onPay} className="px-3 py-1.5 text-sm font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 hover:bg-primary-200">
            Pagar Parcela
        </button>
      </div>
       <div className="mt-2 text-xs text-slate-400 text-right">
            Pago {currencyFormatter.format(debt.paidAmount)} de {currencyFormatter.format(debt.totalAmount)}
       </div>
    </div>
  );
};

export const DebtView: React.FC<DebtViewProps> = ({ debts, currency, onAdd, onEdit, onDelete, onPayInstallment }) => {
  const currencyFormatter = getCurrencyFormatter(currency);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const totalRemainingDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [debts]);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dívidas e Empréstimos</h2>
            <div className="mt-2">
                <p className="text-sm text-slate-500">Saldo Devedor Total</p>
                <p className="font-bold text-2xl text-red-600">{currencyFormatter.format(totalRemainingDebt)}</p>
            </div>
          </div>
          <button onClick={onAdd} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 transition">
            <PlusIcon className="w-5 h-5" /> Nova Dívida
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map((debt) => (
          <DebtCard
            key={debt.id}
            debt={debt}
            currencyFormatter={currencyFormatter}
            onEdit={() => onEdit(debt)}
            onDelete={() => onDelete(debt)}
            onPay={() => setPayingDebt(debt)}
          />
        ))}
      </div>

      {debts.length === 0 && (
        <div className="text-center col-span-full py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
          <ScaleIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="font-semibold">Nenhuma dívida registrada.</p>
          <p>Adicione os financiamentos e empréstimos da sua empresa.</p>
        </div>
      )}

      {payingDebt && (
        <PayInstallmentModal 
            debtName={payingDebt.name}
            onClose={() => setPayingDebt(null)}
            onConfirm={(amount, date) => onPayInstallment(payingDebt.id, amount, date)}
        />
      )}
    </div>
  );
};
