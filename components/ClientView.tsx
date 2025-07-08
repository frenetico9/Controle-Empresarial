import React, { useMemo, useState } from 'react';
import type { Client, Currency, Transaction } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { UsersIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface ClientViewProps {
  transactions: Transaction[];
  currency: Currency;
}

const ClientCard: React.FC<{ client: Client, currencyFormatter: Intl.NumberFormat }> = ({ client, currencyFormatter }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
            <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400 truncate">{client.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{client.transactionCount} transação(ões)</p>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <ArrowUpIcon className="w-4 h-4"/>
                        Receita Gerada
                    </p>
                    <p className="font-semibold text-green-700 dark:text-green-500">{currencyFormatter.format(client.totalRevenue)}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <ArrowDownIcon className="w-4 h-4"/>
                        Custo Gerado
                    </p>
                    <p className="font-semibold text-red-700 dark:text-red-500">{currencyFormatter.format(client.totalExpense)}</p>
                </div>
            </div>
        </div>
    )
}

export const ClientView: React.FC<ClientViewProps> = ({ transactions, currency }) => {
    const currencyFormatter = getCurrencyFormatter(currency);
    const [searchTerm, setSearchTerm] = useState('');

    const clients = useMemo(() => {
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
        return Array.from(clientMap.values()).sort((a,b) => (b.totalRevenue + b.totalExpense) - (a.totalRevenue + a.totalExpense));
    }, [transactions]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [clients, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes e Fornecedores</h2>
                 <p className="mt-1 text-slate-500 dark:text-slate-400">Analise o volume de negócios com seus parceiros.</p>
                 <div className="mt-4">
                     <input 
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-primary-500 focus:ring-primary-500"
                     />
                 </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredClients.map(client => (
                    <ClientCard key={client.name} client={client} currencyFormatter={currencyFormatter} />
                ))}
            </div>

             {clients.length === 0 && (
                <div className="text-center col-span-full py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <UsersIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="font-semibold">Nenhum cliente ou fornecedor encontrado.</p>
                    <p>Comece a adicionar transações e preencha o campo 'Cliente/Fornecedor' para vê-los aqui.</p>
                </div>
            )}
        </div>
    );
};
