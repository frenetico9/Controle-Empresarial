import React, { useState, useEffect } from 'react';
import type { Debt } from '../../types';
import { DebtType } from '../../types';
import { DEBT_TYPES } from '../../constants';

interface AddDebtModalProps {
  onClose: () => void;
  onSave: (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount' > & { id?: string }) => void;
  debtToEdit?: Debt | null;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ onClose, onSave, debtToEdit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<DebtType>(DebtType.EMPRESTIMO_CAPITAL_GIRO);
  const [lender, setLender] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const isEditing = !!debtToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(debtToEdit.name);
      setType(debtToEdit.type);
      setLender(debtToEdit.lender || '');
      setTotalAmount(String(debtToEdit.totalAmount));
      setInterestRate(String(debtToEdit.interestRate));
      setStartDate(new Date(debtToEdit.startDate).toISOString().split('T')[0]);
    }
  }, [debtToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !totalAmount || !interestRate || !startDate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    
    const debtData = {
      name,
      type,
      lender,
      totalAmount: parseFloat(totalAmount),
      interestRate: parseFloat(interestRate),
      startDate,
    };
    
    if(isEditing) {
        onSave({ ...debtData, id: debtToEdit.id });
    } else {
        onSave(debtData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Editar Dívida' : 'Nova Dívida ou Empréstimo'}</h2>
          
          <div>
            <label htmlFor="debt-name" className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome/Descrição</label>
            <input id="debt-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Financiamento do carro, Empréstimo para estoque" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debt-type" className="text-sm font-medium text-slate-600 dark:text-slate-300">Tipo</label>
              <select id="debt-type" value={type} onChange={e => setType(e.target.value as DebtType)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                {DEBT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="debt-lender" className="text-sm font-medium text-slate-600 dark:text-slate-300">Credor (Opcional)</label>
              <input id="debt-lender" type="text" value={lender} onChange={e => setLender(e.target.value)} placeholder="Ex: Banco XYZ" className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debt-total-amount" className="text-sm font-medium text-slate-600 dark:text-slate-300">Valor Total</label>
              <input id="debt-total-amount" type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="50000.00" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="debt-interest" className="text-sm font-medium text-slate-600 dark:text-slate-300">Juros Anual (%)</label>
              <input id="debt-interest" type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="12.5" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
          
           <div>
              <label htmlFor="debt-start-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data de Início</label>
              <input id="debt-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{isEditing ? 'Salvar Alterações' : 'Adicionar Dívida'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
