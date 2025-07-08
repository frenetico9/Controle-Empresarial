import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Transaction, Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';

interface CategoryPieChartProps {
  transactions: Transaction[];
  currency: Currency;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1', '#16a34a'];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions, currency }) => {
  const currencyFormatter = getCurrencyFormatter(currency);

  const { data, totalExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenseData = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === 'expense' && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      })
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = 0;
        }
        acc[t.category] += t.amount;
        return acc;
      }, {} as { [key: string]: number });
      
    const chartData = Object.entries(expenseData)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value); // Sort for consistent color mapping

    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    return { data: chartData, totalExpenses: total };
  }, [transactions]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">Sem despesas este mês.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }} className="relative">
       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">Total do Mês</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{currencyFormatter.format(totalExpenses)}</span>
       </div>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            innerRadius={70}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => currencyFormatter.format(value)} 
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              borderColor: 'rgba(51, 65, 85, 0.9)',
              borderRadius: '0.5rem'
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend iconSize={10} wrapperStyle={{fontSize: '12px', bottom: 0}} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};