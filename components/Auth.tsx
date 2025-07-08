import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Transaction, PayableReceivable, Currency, Achievement, Investment, Debt, Client } from '../types';
import { PaymentMethod, Recurrence } from '../types';
import usePersistentState from '../hooks/usePersistentState';
import * as db from '../services/db';
import { WalletIcon, FirstStepIcon, MedalIcon, TrophyIcon } from './icons';

// --- Achievements Definition ---
const ALL_ACHIEVEMENTS: Omit<Achievement, 'unlocked'>[] = [
    { id: 'first_revenue', title: 'Primeira Venda', description: 'Você registrou sua primeira entrada de receita!', icon: FirstStepIcon },
    { id: 'first_expense', title: 'Primeiro Custo', description: 'Você registrou sua primeira despesa operacional.', icon: MedalIcon },
    { id: 'first_payable', title: 'Contas em Dia', description: 'Sua primeira conta a pagar foi registrada.', icon: MedalIcon },
    { id: 'first_receivable', title: 'A Receber!', description: 'Sua primeira conta a receber foi registrada.', icon: TrophyIcon },
    { id: 'profit_month', title: 'Mês Lucrativo', description: 'Você fechou um mês com lucro!.', icon: TrophyIcon },
];

interface AuthContextType {
  user: User | null;
  // Data
  transactions: Transaction[];
  accounts: PayableReceivable[];
  investments: Investment[];
  debts: Debt[];
  clients: Client[];
  achievements: Achievement[];
  // General
  currency: Currency;
  isDarkMode: boolean;
  isLoading: boolean;
  // Auth & Profile
  login: (email: string, pass:string) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  toggleDarkMode: () => void;
  setCurrency: (currency: Currency) => Promise<void>;
  updateUserProfile: (data: { name: string; email: string; avatarUrl?: string; companyName?: string; }) => Promise<{ success: boolean; message?: string; }>;
  // Handlers
  saveTransaction: (transaction: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveAccount: (account: Omit<PayableReceivable, 'id' | 'status'> & { id?: string }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (accountId: string, newStatus: 'paid' | 'pending') => Promise<void>;
  saveInvestment: (investment: Omit<Investment, 'id' | 'performance' | 'currentValue'> & { id?: string }) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  saveDebt: (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'> & { id?: string }) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  payDebtInstallment: (debtId: string, amount: number, date: string) => Promise<void>;
  // PWA Install
  triggerInstallPrompt: () => void;
  canInstall: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = usePersistentState<User | null>('empresa-gestor-user', null);
  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<PayableReceivable[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [isDarkMode, setIsDarkMode] = usePersistentState('theme:dark', false);
  const [isLoading, setIsLoading] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);


  // --- PWA Install prompt listener ---
  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
        console.log("beforeinstallprompt event captured!");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstallPrompt = () => {
    if (!installPromptEvent) {
      console.log("Install prompt not available");
      return;
    }
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA prompt');
      } else {
        console.log('User dismissed the PWA prompt');
      }
      setInstallPromptEvent(null);
    });
  };

  const calculateClients = useCallback((transactions: Transaction[]) => {
      const clientMap = new Map<string, Client>();
      transactions.forEach(t => {
          const name = t.clientOrSupplier;
          if (!name) return;

          if (!clientMap.has(name)) {
              clientMap.set(name, { name, totalRevenue: 0, totalExpense: 0, transactionCount: 0 });
          }

          const client = clientMap.get(name)!;
          client.transactionCount++;
          if (t.type === 'revenue') {
              client.totalRevenue += t.amount;
          } else {
              client.totalExpense += t.amount;
          }
      });
      setClients(Array.from(clientMap.values()).sort((a,b) => (b.totalRevenue + b.totalExpense) - (a.totalRevenue + a.totalExpense)));
  }, []);

  // --- Achievements Calculator ---
  const calculateAchievements = useCallback((data: { transactions: Transaction[], accounts: PayableReceivable[] }) => {
    const unlockedAchievements = new Set<string>();

    if (data.transactions.some(t => t.type === 'revenue')) unlockedAchievements.add('first_revenue');
    if (data.transactions.some(t => t.type === 'expense')) unlockedAchievements.add('first_expense');
    if (data.accounts.some(a => a.type === 'payable')) unlockedAchievements.add('first_payable');
    if (data.accounts.some(a => a.type === 'receivable')) unlockedAchievements.add('first_receivable');
    // TODO: Implement 'profit_month' logic (more complex check)

    const fullAchievements = ALL_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: unlockedAchievements.has(ach.id)
    }));
    setAchievements(fullAchievements);
  }, []);

  const refreshAllData = useCallback(async (userId: string) => {
    const allData = await db.getAllUserData(userId);
    setTransactions(allData.transactions);
    setAccounts(allData.accounts);
    setInvestments(allData.investments);
    setDebts(allData.debts);
    calculateAchievements(allData);
    calculateClients(allData.transactions);
  }, [calculateAchievements, calculateClients]);

  // --- Data Loading Effect ---
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (user?.id) {
        await refreshAllData(user.id);
      } else {
        // Clear all data if no user
        setTransactions([]);
        setAccounts([]);
        setInvestments([]);
        setDebts([]);
        setClients([]);
        setAchievements([]);
      }
      setIsLoading(false);
    };
    init();
  }, [user, refreshAllData]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => setIsDarkMode(prev => !prev), [setIsDarkMode]);

  // --- Auth Functions ---
  const login = async (email: string, pass: string): Promise<boolean> => {
    const loggedInUser = await db.login(email, pass);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const { user: newUser, error } = await db.register(name, email, pass);
    if (error) return { success: false, message: error };
    if (newUser) {
      await login(email, pass);
      return { success: true };
    }
    return { success: false, message: 'Ocorreu um erro desconhecido.' };
  };

  const logout = () => setUser(null);

  const setCurrency = async (currency: Currency) => {
    if (!user) return;
    await db.updateUserCurrency(user.id, currency);
    setUser(prev => prev ? { ...prev, currency } : null);
  }

  const updateUserProfile = async (data: { name: string; email: string; avatarUrl?: string; companyName?: string; }): Promise<{ success: boolean; message?: string; }> => {
    if (!user) return { success: false, message: "Usuário não logado" };
    const { user: updatedUser, error } = await db.updateUserProfile(user.id, data);
    if (error) return { success: false, message: error };
    if (updatedUser) {
        setUser(updatedUser);
        return { success: true };
    }
    return { success: false, message: "Falha ao atualizar o perfil." };
  };

  // --- Data Handlers ---
  const saveTransaction = async (transaction: Omit<Transaction, 'id'> & { id?: string }) => {
    if (!user) return;
    if (transaction.id) {
      await db.updateTransaction(transaction.id, transaction);
    } else {
      await db.addTransaction(user.id, transaction);
    }
    await refreshAllData(user.id);
  };
  
  const deleteTransaction = async (id: string) => {
    if(!user) return;
    await db.deleteTransaction(id);
    await refreshAllData(user.id);
  };
  
  const saveAccount = async (account: Omit<PayableReceivable, 'id' | 'status'> & { id?: string }) => {
    if(!user) return;
     if (account.id) {
        await db.updateAccount(account.id, account);
    } else {
        await db.addAccount(user.id, account);
    }
    await refreshAllData(user.id);
  };
  const deleteAccount = async (id: string) => {
      if(!user) return;
      await db.deleteAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
  }
  
  const toggleAccountStatus = async (accountId: string, newStatus: 'paid' | 'pending') => {
      if(!user) return;
      await db.toggleAccountStatus(accountId, newStatus);
      await refreshAllData(user.id);
  }

  const saveInvestment = async (investment: Omit<Investment, 'id' | 'performance' | 'currentValue'> & { id?: string }) => {
      if(!user) return;
      if (investment.id) {
          await db.updateInvestment(investment.id, investment);
      } else {
          await db.addInvestment(user.id, investment);
      }
      await refreshAllData(user.id);
  }

  const deleteInvestment = async (id: string) => {
      if(!user) return;
      await db.deleteInvestment(id);
      await refreshAllData(user.id);
  }

  const saveDebt = async (debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'> & { id?: string }) => {
    if(!user) return;
    if(debt.id) {
        await db.updateDebt(debt.id, {...debt, userId: user.id});
    } else {
        await db.addDebt(user.id, debt);
    }
    await refreshAllData(user.id);
  }

  const deleteDebt = async (id: string) => {
      if(!user) return;
      await db.deleteDebt(id);
      await refreshAllData(user.id);
  }

  const payDebtInstallment = async (debtId: string, amount: number, date: string) => {
      if(!user) return;
      const debt = debts.find(d => d.id === debtId);
      if(!debt) return;
      
      await db.addTransaction(user.id, {
          amount,
          date,
          category: 'Pagamento de Empréstimo',
          description: `Pagamento Parcela - ${debt.name}`,
          type: 'expense',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          recurrence: Recurrence.NONE,
          clientOrSupplier: debt.lender,
          debtPaymentForId: debtId
      });
      await refreshAllData(user.id);
  }

  return (
    <AuthContext.Provider value={{ 
        user, 
        transactions,
        accounts,
        investments,
        debts,
        clients,
        achievements,
        currency: user?.currency || 'BRL',
        isDarkMode,
        isLoading,
        login, 
        logout, 
        register,
        toggleDarkMode,
        setCurrency,
        updateUserProfile,
        saveTransaction, deleteTransaction,
        saveAccount, deleteAccount, toggleAccountStatus,
        saveInvestment, deleteInvestment,
        saveDebt, deleteDebt, payDebtInstallment,
        triggerInstallPrompt,
        canInstall: !!installPromptEvent,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a DataProvider');
  }
  return context;
};

export const LoginPage: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (isRegistering) {
                if(!name) {
                    setError('Por favor, informe seu nome.');
                    setIsSubmitting(false);
                    return;
                }
                const result = await register(name, email, password);
                if (!result.success) {
                    setError(result.message || 'Ocorreu um erro no registro.');
                }
            } else {
                const success = await login(email, password);
                if (!success) {
                    setError('E-mail ou senha inválidos.');
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const toggleForm = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <WalletIcon className="h-10 w-10 text-primary-600" />
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestor Financeiro</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isRegistering ? 'Crie sua conta para começar a gerir seu negócio.' : 'O controle financeiro da sua empresa, simplificado.'}
                    </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {isRegistering && (
                         <div>
                            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Seu Nome</label>
                            <input id="name" name="name" type="text" required value={name} onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-md text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Seu nome"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email de Acesso</label>
                        <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-md text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"
                               className="text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
                        <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-md text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Sua senha"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button type="submit"
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Processando...' : (isRegistering ? 'Registrar' : 'Entrar')}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm">
                    <button onClick={toggleForm} className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                         {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Crie agora'}
                    </button>
                </div>
            </div>
        </div>
    );
};