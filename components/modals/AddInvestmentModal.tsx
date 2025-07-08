import React, { useState, useEffect } from 'react';
import type { Investment } from '../../types';
import { InvestmentType } from '../../types';
import { INVESTMENT_TYPES } from '../../constants';

interface AddInvestmentModalProps {
  onClose: () => void;
  onSave: (investment: Omit<Investment, 'id' | 'performance' | 'currentValue'> & { id?: string }) => void;
  investmentToEdit?: Investment | null;
}

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ onClose, onSave, investmentToEdit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>(InvestmentType.ACAO);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const isEditing = !!investmentToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(investmentToEdit.name);
      setType(investmentToEdit.type);
      setQuantity(String(investmentToEdit.quantity));
      setPurchasePrice(String(investmentToEdit.purchasePrice));
      setCurrentPrice(String(investmentToEdit.currentPrice));
      setPurchaseDate(new Date(investmentToEdit.purchaseDate).toISOString().split('T')[0]);
    }
  }, [investmentToEdit, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !purchasePrice || !currentPrice || !purchaseDate) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    
    const investmentData = {
      name,
      type,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      currentPrice: parseFloat(currentPrice),
      purchaseDate,
    };
    
    if(isEditing) {
        onSave({ ...investmentData, id: investmentToEdit.id });
    } else {
        onSave(investmentData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{isEditing ? 'Editar Ativo' : 'Adicionar Novo Ativo'}</h2>
          
          <div>
            <label htmlFor="inv-name" className="text-sm font-medium text-slate-600 dark:text-slate-300">Nome do Ativo</label>
            <input id="inv-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Ações da Empresa X, CDB Banco Y" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
          </div>

          <div>
            <label htmlFor="inv-type" className="text-sm font-medium text-slate-600 dark:text-slate-300">Tipo de Investimento</label>
            <select id="inv-type" value={type} onChange={e => setType(e.target.value as InvestmentType)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700">
              {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-quantity" className="text-sm font-medium text-slate-600 dark:text-slate-300">Quantidade</label>
              <input id="inv-quantity" type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
             <div>
              <label htmlFor="inv-purchase-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Data da Compra</label>
              <input id="inv-purchase-date" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inv-purchase-price" className="text-sm font-medium text-slate-600 dark:text-slate-300">Preço de Compra (Unit.)</label>
              <input id="inv-purchase-price" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="10.50" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
            <div>
              <label htmlFor="inv-current-price" className="text-sm font-medium text-slate-600 dark:text-slate-300">Preço Atual (Unit.)</label>
              <input id="inv-current-price" type="number" step="0.01" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="12.75" required className="mt-1 w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{isEditing ? 'Salvar Alterações' : 'Adicionar Ativo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
