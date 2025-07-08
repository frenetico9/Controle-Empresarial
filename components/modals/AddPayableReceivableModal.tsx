import React, { useState, useEffect } from 'react';
import type { PayableReceivable } from '../../types';

interface AddPayableReceivableModalProps {
  onClose: () => void;
  onSave: (account: Omit<PayableReceivable, 'id' | 'status'> & { id?: string }) => void;
  accountToEdit?: PayableReceivable | null;
}

export const AddPayableReceivableModal: React.FC<AddPayableReceivableModalProps> = ({ onClose, onSave, accountToEdit }) => {
  const [type, setType] = useState<'payable' | 'receivable'>('payable');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientOrSupplier, setClientOrSupplier] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!accountToEdit;

  useEffect(() => {
    if (isEditing) {
      setType(accountToEdit.type);
      setDescription(accountToEdit.description);
      setAmount(String(accountToEdit.amount));
      setDueDate(accountToEdit.dueDate.split('T')[0]);
      setClientOrSupplier(accountToEdit.clientOrSupplier || '');
    }
  }, [accountToEdit, isEditing]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setError('');
    
    const accountData = {
      description,
      amount: parseFloat(amount),
      dueDate,
      type,
      clientOrSupplier,
    };
    
    if(isEditing) {
        onSave({ ...accountData, id: accountToEdit.id });
    } else {
        onSave(accountData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Editar Conta' : 'Nova Conta'}</h2>
          
           <div className="grid grid-cols-2 gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
            <button type="button" onClick={() => setType('payable')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'payable' ? 'bg-white dark:bg-slate-800 shadow text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>A Pagar</button>
            <button type="button" onClick={() => setType('receivable')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${type === 'receivable' ? 'bg-white dark:bg-slate-800 shadow text-green-500' : 'text-slate-600 dark:text-slate-300'}`}>A Receber</button>
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium text-slate-600 dark:text-slate-300">Descrição</label>
            <input id="description" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pagamento fornecedor, Recebimento cliente" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="text-sm font-medium text-slate-600 dark:text-slate-300">Valor</label>
              <input id="amount" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
            </div>
            <div>
                <label htmlFor="dueDate" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data de Vencimento</label>
                <input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
            </div>
          </div>
          
           <div>
              <label htmlFor="clientOrSupplier" className="text-sm font-medium text-slate-600 dark:text-slate-300">Cliente / Fornecedor (Opcional)</label>
              <input id="clientOrSupplier" type="text" value={clientOrSupplier} onChange={e => setClientOrSupplier(e.target.value)} placeholder="Ex: Empresa Exemplo, Fornecedor ABC" className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition">{isEditing ? 'Salvar Alterações' : 'Adicionar Conta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};