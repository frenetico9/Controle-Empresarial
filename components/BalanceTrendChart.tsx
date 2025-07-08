import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction, Currency } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';

type Timeframe = '6m' | '12m' | 'ytd';

interface BalanceTrendChartProps {
  transactions: Transaction[];
  currency: Currency;
  timeframe: Timeframe;
}

export const BalanceTrendChart: React.FC<BalanceTrendChartProps> = ({ transactions, currency, timeframe }) => {
  const currencyFormatter = getCurrencyFormatter(currency);

  const data = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (timeframe === '6m') {
        startDate.setMonth(now.getMonth() - 5);
        startDate.setDate(1);
    } else if (timeframe === '12m') {
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
    } else { // ytd
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    
    startDate.setHours(0, 0, 0, 0);

    const monthlyData: { [key: string]: { revenue: number; expense: number; date: Date } } = {};
    
    // Pre-populate months for the range to ensure continuity
    let d = new Date(startDate);
    while (d <= now) {
        const year = d.getFullYear();
        const month = d.getMonth();
        const key = `${year}-${month}`;
        monthlyData[key] = { revenue: 0, expense: 0, date: new Date(year, month, 1) };
        d.setMonth(d.getMonth() + 1);
    }

    transactions
      .filter(t => new Date(t.date) >= startDate)
      .forEach(t => {
        const transactionDate = new Date(t.date);
        const year = transactionDate.getFullYear();
        const month = transactionDate.getMonth();
        const key = `${year}-${month}`;

        if (monthlyData[key]) {
             if (t.type === 'revenue') {
                monthlyData[key].revenue += t.amount;
            } else {
                monthlyData[key].expense += t.amount;
            }
        }
    });
    
    const chartData = Object.values(monthlyData)
      .map(values => {
        const rawMonth = values.date.toLocaleString('pt-BR', { month: 'short' });
        const formattedMonth = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1).replace('.', '');
        
        const year = values.date.getFullYear();
        const shortYear = `'${year.toString().slice(-2)}`;
        
        const name = `${formattedMonth}/${shortYear}`;

        return {
          name,
          Receitas: values.revenue,
          Despesas: values.expense,
          Resultado: values.revenue - values.expense,
          date: values.date,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return chartData;
  }, [transactions, timeframe]);
  
  const yAxisFormatter = (value: number) => {
      if (value === 0) return '0';
      if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
      return value.toString();
  };

  return (
    data.length === 0 ? (
       <div className="flex items-center justify-center h-[300px] text-slate-500 dark:text-slate-400">Sem dados para exibir no período.</div>
    ) : (
         <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="name" stroke="rgb(100 116 139 / var(--tw-text-opacity))" tick={{fontSize: 12}} />
                <YAxis tickFormatter={yAxisFormatter} stroke="rgb(100 116 139 / var(--tw-text-opacity))" tick={{fontSize: 12}} width={40} />
                <Tooltip
                    formatter={(value: number, name: string) => [currencyFormatter.format(value), name]}
                    contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    borderColor: 'rgba(51, 65, 85, 0.9)',
                    borderRadius: '0.5rem'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}
                />
                <Legend wrapperStyle={{fontSize: '14px', paddingTop: '10px'}}/>
                <Bar dataKey="Receitas" fill="#22c55e" barSize={20} />
                <Bar dataKey="Despesas" fill="#ef4444" barSize={20} />
                <Line type="monotone" dataKey="Resultado" stroke="#3b82f6" strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>
         </div>
    )
  );
};