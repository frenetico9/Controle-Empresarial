import React, { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
import { PaymentMethod, Recurrence } from '../../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../constants';

interface AddTransactionModalProps {
  onClose: () => void;
  onSaveTransaction: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  transactionToEdit?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSaveTransaction, transactionToEdit }) => {
  const [type, setType] = useState<'revenue' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.BANK_TRANSFER);
  const [recurrence, setRecurrence] = useState(Recurrence.NONE);
  const [clientOrSupplier, setClientOrSupplier] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!transactionToEdit;

  useEffect(() => {
    if (isEditing) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setDate(transactionToEdit.date.split('T')[0]);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setRecurrence(transactionToEdit.recurrence);
      setClientOrSupplier(transactionToEdit.clientOrSupplier || '');
    }
  }, [transactionToEdit, isEditing]);

  const handleTypeChange = (newType: 'revenue' | 'expense') => {
    setType(newType);
    setCategory(''); // Reset category when type changes
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category || !date) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    
    const transactionData = {
      amount: parseFloat(amount),
      description,
      category,
      date,
      type,
      paymentMethod,
      recurrence,
      clientOrSupplier,
    };
    
    if(isEditing) {
        onSaveTransaction({ ...transactionData, id: transactionToEdit.id });
    } else {
        onSaveTransaction(transactionData);
    }
  };

  const categoryList = type === 'revenue' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Editar Lançamento' : 'Novo Lançamento no Caixa'}</h2>
          
          <div className="grid grid-cols-2 gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
            <button type="button" disabled={isEditing} onClick={() => handleTypeChange('expense')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${type === 'expense' ? 'bg-white dark:bg-slate-800 shadow text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>Despesa</button>
            <button type="button" disabled={isEditing} onClick={() => handleTypeChange('revenue')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${type === 'revenue' ? 'bg-white dark:bg-slate-800 shadow text-green-500' : 'text-slate-600 dark:text-slate-300'}`}>Receita</button>
          </div>
          
          <div>
            <label htmlFor="amount" className="text-sm font-medium text-slate-600 dark:text-slate-300">Valor</label>
            <input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
            <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Venda de software, Pagamento de aluguel" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="text-sm font-medium text-slate-600 dark:text-slate-300">Categoria</label>
              <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                  <option value="" disabled>Selecione...</option>
                  {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data</label>
              <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
            </div>
          </div>
          
           <div>
              <label htmlFor="clientOrSupplier" className="text-sm font-medium text-slate-600 dark:text-slate-300">Cliente / Fornecedor (Opcional)</label>
              <input id="clientOrSupplier" type="text" value={clientOrSupplier} onChange={e => setClientOrSupplier(e.target.value)} placeholder="Ex: Empresa Exemplo, Fornecedor ABC" className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="paymentMethod" className="text-sm font-medium text-slate-600 dark:text-slate-300">Meio de Pagamento</label>
              <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="recurrence" className="text-sm font-medium text-slate-600 dark:text-slate-300">Recorrência</label>
              <select id="recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value as Recurrence)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500">
                  {Object.values(Recurrence).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">{isEditing ? 'Salvar Alterações' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};