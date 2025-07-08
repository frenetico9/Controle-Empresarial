import React from 'react';
import { MenuIcon } from './icons';
import type { View } from '../types';
import { InstallButtonHeader } from './InstallButtonHeader';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeView: View;
}

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    cashflow: 'Fluxo de Caixa',
    accounts: 'Contas a Pagar e Receber',
    investments: 'Carteira de Investimentos',
    debts: 'Dívidas e Empréstimos',
    clients: 'Clientes e Fornecedores',
    reports: 'Relatórios Gerenciais',
    settings: 'Configurações',
}

export const Header: React.FC<HeaderProps> = ({ setSidebarOpen, activeView }) => {
  return (
    <header className="flex-shrink-0 bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <button
          className="md:hidden text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu lateral"
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon className="w-6 h-6" />
        </button>

        <div className="flex-1 flex justify-center items-center">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{viewTitles[activeView] || 'Gestor Financeiro'}</h1>
                {activeView === 'dashboard' && <InstallButtonHeader />}
            </div>
        </div>
        
        {/* Placeholder to keep title centered on mobile when hamburger is visible */}
        <div className="md:hidden invisible">
          <MenuIcon className="w-6 h-6" />
        </div>
      </div>
    </header>
  );
};