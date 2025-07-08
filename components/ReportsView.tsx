import React, { useMemo } from 'react';
import type { Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { DownloadIcon, ArrowUpIcon, ArrowDownIcon, WalletIcon, TrendingUpIcon, ScaleIcon, ChartPieIcon } from './icons';
import { exportBalanceSheetPDF, exportFullReportToExcel } from '../services/exportService';
import { useAuth } from './Auth';

const ReportCard: React.FC<{title: string, value: string, icon: React.ReactNode, details: React.ReactNode}> = ({title, value, icon, details}) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
            </div>
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
                {icon}
            </div>
        </div>
        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            {details}
        </div>
    </div>
);


export const ReportsView: React.FC<{currency: Currency}> = ({ currency }) => {
    const { user, accounts, transactions, investments, debts } = useAuth();
    const currencyFormatter = getCurrencyFormatter(currency);
    
    const financialSummary = useMemo(() => {
        const cashBalance = transactions.reduce((acc, t) => (t.type === 'revenue' ? acc + t.amount : acc - t.amount), 0);
        const investmentsCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
        const remainingDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
        const totalAssets = cashBalance + investmentsCurrentValue;
        const netWorth = totalAssets - remainingDebt;
        
        return { cashBalance, investmentsCurrentValue, remainingDebt, totalAssets, netWorth };
    }, [transactions, investments, debts]);

    const handlePdfExport = () => {
        if (user) {
            exportBalanceSheetPDF({
                cashBalance: financialSummary.cashBalance,
                investments,
                debts
            }, currency, user.companyName || user.name);
        }
    };
    
    const handleExcelExport = () => {
        if (user) {
            exportFullReportToExcel({
                transactions,
                accounts,
                investments,
                debts,
                financialSummary: {
                    ...financialSummary,
                    totalAssets: financialSummary.totalAssets,
                }
            }, user.companyName || user.name);
        }
    }
    
    return (
        <div className="space-y-6">
             <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatórios Gerenciais</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Exporte a saúde financeira da sua empresa.</p>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={handleExcelExport} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition">
                        <DownloadIcon className="w-5 h-5" /> Excel Completo
                    </button>
                    <button onClick={handlePdfExport} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition">
                        <DownloadIcon className="w-5 h-5" /> Balanço PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                   <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                     <p className="text-sm font-medium text-green-800 dark:text-green-300">Total de Ativos</p>
                     <p className="text-3xl font-bold text-green-600 dark:text-green-400">{currencyFormatter.format(financialSummary.totalAssets)}</p>
                   </div>
                   <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                     <p className="text-sm font-medium text-red-800 dark:text-red-300">Total de Passivos (Dívidas)</p>
                     <p className="text-3xl font-bold text-red-600 dark:text-red-400">{currencyFormatter.format(financialSummary.remainingDebt)}</p>
                   </div>
                </div>
                 <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                     <p className="text-lg font-bold text-indigo-800 dark:text-indigo-300">PATRIMÔNIO LÍQUIDO</p>
                     <p className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 my-2">{currencyFormatter.format(financialSummary.netWorth)}</p>
                     <p className="text-sm text-indigo-500 dark:text-indigo-400">(Ativos - Passivos)</p>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <ReportCard 
                    title="Caixa e Contas" 
                    value={currencyFormatter.format(financialSummary.cashBalance)}
                    icon={<WalletIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />}
                    details={<p className="text-sm text-slate-500 dark:text-slate-400">Dinheiro disponível para as operações do dia a dia.</p>}
                />
                 <ReportCard 
                    title="Investimentos" 
                    value={currencyFormatter.format(financialSummary.investmentsCurrentValue)}
                    icon={<TrendingUpIcon className="w-7 h-7 text-green-600 dark:text-green-400" />}
                    details={
                        <p className="text-sm text-slate-500 dark:text-slate-400">Valor de mercado atual da carteira de investimentos.</p>
                    }
                />
                <ReportCard 
                    title="Dívidas e Empréstimos" 
                    value={currencyFormatter.format(financialSummary.remainingDebt)}
                    icon={<ScaleIcon className="w-7 h-7 text-red-600 dark:text-red-400" />}
                    details={
                        <p className="text-sm text-slate-500 dark:text-slate-400">Saldo devedor total dos financiamentos e empréstimos.</p>
                    }
                />
            </div>

        </div>
    );
};