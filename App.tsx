import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CashFlowView } from './components/CashFlowView';
import { AccountsView } from './components/AccountsView';
import { Settings } from './components/Settings';
import type { View, Transaction, PayableReceivable, Investment, Debt } from './types';
import { AddTransactionModal } from './components/modals/AddTransactionModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { PlusIcon, WalletIcon } from './components/icons';
import { useAuth, LoginPage } from './components/Auth';
import { ReportsView } from './components/ReportsView';
import { AddPayableReceivableModal } from './components/modals/AddPayableReceivableModal';
import { InvestmentView } from './components/InvestmentView';
import { AddInvestmentModal } from './components/modals/AddInvestmentModal';
import { DebtView } from './components/DebtView';
import { AddDebtModal } from './components/modals/AddDebtModal';
import { ClientView } from './components/ClientView';


const App: React.FC = () => {
  const { 
    user, 
    isLoading,
    // Data
    transactions, 
    accounts,
    investments,
    debts,
    achievements,
    // General
    currency, 
    isDarkMode, 
    toggleDarkMode,
    setCurrency,
    // Handlers
    saveTransaction, deleteTransaction,
    saveAccount, deleteAccount, toggleAccountStatus,
    saveInvestment, deleteInvestment,
    saveDebt, deleteDebt, payDebtInstallment,
  } = useAuth();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // --- Modal states ---
  const [addTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PayableReceivable | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<PayableReceivable | null>(null);
  
  const [addInvestmentModalOpen, setAddInvestmentModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);

  const [addDebtModalOpen, setAddDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);


  // --- Handlers ---
  const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> & { id?: string }) => {
    await saveTransaction(transaction);
    setAddTransactionModalOpen(false);
    setEditingTransaction(null);
  };
  
  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    setDeletingTransaction(null);
  };

  const handleSaveAccount = async (account: Omit<PayableReceivable, 'id' | 'status'> & { id?: string }) => {
    await saveAccount(account);
    setAddAccountModalOpen(false);
    setEditingAccount(null);
  }
  
  const handleSaveInvestment = async (investment: Omit<Investment, 'id' | 'performance' | 'currentValue'> & { id?: string }) => {
      await saveInvestment(investment);
      setAddInvestmentModalOpen(false);
      setEditingInvestment(null);
  }
  
  const handleSaveDebt = async (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'> & { id?: string }) => {
    await saveDebt(debt);
    setAddDebtModalOpen(false);
    setEditingDebt(null);
  }

  // --- Memoized Calculations ---
  const financialSummary = useMemo(() => {
    const cashBalance = transactions.reduce((acc, t) => {
        return t.type === 'revenue' ? acc + t.amount : acc - t.amount;
    }, 0);

    const totalInvested = investments.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0);
    const investmentsCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);

    const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalDebtPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
    const remainingDebt = totalDebtAmount - totalDebtPaid;

    const totalAssets = cashBalance + investmentsCurrentValue;
    const netWorth = totalAssets - remainingDebt;
    
    return {
        cashBalance,
        totalInvested,
        investmentsCurrentValue,
        totalDebtAmount,
        remainingDebt,
        netWorth,
    };
  }, [transactions, investments, debts]);
  
  const handleEditTransaction = (transaction: Transaction) => {
      setEditingTransaction(transaction);
      setAddTransactionModalOpen(true);
  };
  
  const handleEditAccount = (account: PayableReceivable) => {
      setEditingAccount(account);
      setAddAccountModalOpen(true);
  };
  
  const handleEditInvestment = (investment: Investment) => {
    setEditingInvestment(investment);
    setAddInvestmentModalOpen(true);
  }
  
  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setAddDebtModalOpen(true);
  }


  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <WalletIcon className="h-12 w-12 text-primary-600 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-300">Carregando o universo financeiro da sua empresa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
            transactions={transactions} 
            accounts={accounts} 
            financialSummary={financialSummary}
            currency={currency} 
        />;
      case 'cashflow':
        return <CashFlowView transactions={transactions} onEdit={handleEditTransaction} onDelete={setDeletingTransaction} currency={currency}/>;
      case 'accounts':
        return <AccountsView accounts={accounts} currency={currency} onAdd={() => {setEditingAccount(null); setAddAccountModalOpen(true);}} onEdit={handleEditAccount} onDelete={setDeletingAccount} onToggleStatus={toggleAccountStatus} />;
      case 'investments':
        return <InvestmentView investments={investments} currency={currency} onAdd={() => {setEditingInvestment(null); setAddInvestmentModalOpen(true);}} onEdit={handleEditInvestment} onDelete={setDeletingInvestment}/>;
      case 'debts':
        return <DebtView debts={debts} currency={currency} onAdd={() => {setEditingDebt(null); setAddDebtModalOpen(true);}} onEdit={handleEditDebt} onDelete={setDeletingDebt} onPayInstallment={payDebtInstallment} />;
      case 'clients':
        return <ClientView transactions={transactions} currency={currency} />;
      case 'reports':
          return <ReportsView currency={currency} />;
      case 'settings':
        return <Settings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} currency={currency} setCurrency={setCurrency} achievements={achievements} />;
      default:
        return <Dashboard 
            transactions={transactions} 
            accounts={accounts} 
            financialSummary={financialSummary}
            currency={currency} 
        />;
    }
  };

  return (
    <div className={`flex h-screen font-sans bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200`}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} activeView={activeView} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
      
      {/* FAB */}
      <button
        onClick={() => { setEditingTransaction(null); setAddTransactionModalOpen(true); }}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 z-20"
        aria-label="Nova Venda / Despesa"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
      
      {/* --- Modals --- */}
      {(addTransactionModalOpen || editingTransaction) && (
        <AddTransactionModal 
            onClose={() => { setAddTransactionModalOpen(false); setEditingTransaction(null); }} 
            onSaveTransaction={handleSaveTransaction}
            transactionToEdit={editingTransaction}
        />
      )}
      
      {deletingTransaction && (
        <ConfirmationModal
          title="Excluir Lançamento"
          description="Você tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
          onConfirm={() => handleDeleteTransaction(deletingTransaction.id).then(() => setDeletingTransaction(null))}
          onClose={() => setDeletingTransaction(null)}
        />
      )}

      {(addAccountModalOpen || editingAccount) && (
          <AddPayableReceivableModal
            onClose={() => { setAddAccountModalOpen(false); setEditingAccount(null);}}
            onSave={handleSaveAccount}
            accountToEdit={editingAccount}
          />
      )}

      {deletingAccount && (
        <ConfirmationModal
            title="Excluir Conta"
            description="Tem certeza que deseja excluir esta conta a pagar/receber?"
            onConfirm={() => deleteAccount(deletingAccount.id).then(() => setDeletingAccount(null))}
            onClose={() => setDeletingAccount(null)}
        />
      )}

      {(addInvestmentModalOpen || editingInvestment) && (
          <AddInvestmentModal
              onClose={() => { setAddInvestmentModalOpen(false); setEditingInvestment(null);}}
              onSave={handleSaveInvestment}
              investmentToEdit={editingInvestment}
          />
      )}

      {deletingInvestment && (
          <ConfirmationModal
              title="Excluir Investimento"
              description="Tem certeza que deseja excluir este investimento? Esta ação liquidará o ativo do seu portfólio."
              onConfirm={() => deleteInvestment(deletingInvestment.id).then(() => setDeletingInvestment(null))}
              onClose={() => setDeletingInvestment(null)}
          />
      )}

      {(addDebtModalOpen || editingDebt) && (
        <AddDebtModal
          onClose={() => { setAddDebtModalOpen(false); setEditingDebt(null); }}
          onSave={handleSaveDebt}
          debtToEdit={editingDebt}
        />
      )}

      {deletingDebt && (
        <ConfirmationModal
          title="Excluir Dívida"
          description="Tem certeza que deseja excluir este registro de dívida? Isso não afetará os pagamentos já realizados."
          onConfirm={() => deleteDebt(deletingDebt.id).then(() => setDeletingDebt(null))}
          onClose={() => setDeletingDebt(null)}
        />
      )}

    </div>
  );
};

export default App;