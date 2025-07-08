import type { Transaction, Currency, PayableReceivable, Investment, Debt } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';


declare var jspdf: any;
declare var XLSX: any;

const autoSizeColumns = (worksheet: any, data: any[]): void => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const colWidths = headers.map(key => ({
        wch: Math.max(
            key.length, 
            ...data.map(row => (row[key as keyof typeof row] ?? '').toString().length)
        ) + 2
    }));
    worksheet['!cols'] = colWidths;
};

export const exportTransactionsToExcel = (data: Transaction[], fileName: string): void => {
    if (!data || data.length === 0) {
        console.warn("No data to export for Excel.");
        return;
    }
    const worksheetData = data.map(t => ({
        'Data': new Date(t.date).toLocaleDateString('pt-BR'),
        'Descrição': t.description,
        'Categoria': t.category,
        'Tipo': t.type === 'revenue' ? 'Receita' : 'Despesa',
        'Valor': t.amount,
        'Método de Pagamento': t.paymentMethod,
        'Cliente/Fornecedor': t.clientOrSupplier,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fluxo de Caixa');

    autoSizeColumns(worksheet, worksheetData);

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};


export const exportTransactionsToPDF = (data: Transaction[], currency: Currency): void => {
    if (!data || data.length === 0) {
        console.warn("No data to export for PDF.");
        return;
    }
    const doc = new jspdf.jsPDF();
    const currencyFormatter = getCurrencyFormatter(currency);

    doc.setFontSize(18);
    doc.text('Relatório de Fluxo de Caixa', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);

    const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
    const tableRows: any[] = [];

    data.forEach(t => {
        const transactionData = [
            new Date(t.date).toLocaleDateString('pt-BR'),
            t.description,
            t.category,
            t.type === 'revenue' ? 'Receita' : 'Despesa',
            currencyFormatter.format(t.amount),
        ];
        tableRows.push(transactionData);
    });

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        headStyles: { fillColor: [37, 99, 235] }, // primary-600
        theme: 'striped',
        styles: {
            font: 'Inter',
            fontSize: 10,
        }
    });

    // Add Summary Footer
    const finalY = (doc as any).lastAutoTable.finalY;
    const totalIncome = data.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netResult = totalIncome - totalExpense;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo do Período:', 14, finalY + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Receitas: ${currencyFormatter.format(totalIncome)}`, 14, finalY + 16);
    doc.text(`Total de Despesas: ${currencyFormatter.format(totalExpense)}`, 14, finalY + 21);

    doc.setFont('helvetica', 'bold');
    doc.text(`Resultado Líquido: ${currencyFormatter.format(netResult)}`, 14, finalY + 26);


    doc.save('fluxo_de_caixa.pdf');
};

interface BalanceSheetData {
  cashBalance: number;
  investments: Investment[];
  debts: Debt[];
}

export const exportBalanceSheetPDF = (data: BalanceSheetData, currency: Currency, companyName: string): void => {
    const doc = new jspdf.jsPDF();
    const currencyFormatter = getCurrencyFormatter(currency);
    const today = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Balanço Patrimonial', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${companyName}`, 105, 28, { align: 'center' });
    doc.text(`Data: ${today}`, 105, 34, { align: 'center' });

    let yPos = 50;

    // --- ASSETS ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ativos', 14, yPos);
    yPos += 8;

    const assetsBody = [];
    let totalAssets = 0;

    assetsBody.push(['Caixa e Contas', currencyFormatter.format(data.cashBalance)]);
    totalAssets += data.cashBalance;

    const totalInvestments = data.investments.reduce((sum, i) => sum + i.currentValue, 0);
    assetsBody.push(['Investimentos', currencyFormatter.format(totalInvestments)]);
    totalAssets += totalInvestments;
    
    (doc as any).autoTable({
        head: [['Ativo', 'Valor']],
        body: assetsBody,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }, // green-500
    });
    yPos = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total de Ativos:', 14, yPos);
    doc.text(currencyFormatter.format(totalAssets), 200, yPos, { align: 'right'});
    yPos += 15;


    // --- LIABILITIES ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Passivos (Dívidas)', 14, yPos);
    yPos += 8;
    
    const liabilitiesBody = data.debts.map(d => [d.name, currencyFormatter.format(d.remainingAmount)]);
    const totalLiabilities = data.debts.reduce((sum, d) => sum + d.remainingAmount, 0);

    (doc as any).autoTable({
        head: [['Passivo', 'Valor']],
        body: liabilitiesBody,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }, // red-500
    });

    yPos = (doc as any).lastAutoTable.finalY + 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total de Passivos:', 14, yPos);
    doc.text(currencyFormatter.format(totalLiabilities), 200, yPos, { align: 'right'});
    yPos += 15;

    // --- EQUITY ---
    const equity = totalAssets - totalLiabilities;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Patrimônio Líquido:', 14, yPos);
    doc.text(currencyFormatter.format(equity), 200, yPos, { align: 'right'});
    
    doc.save(`balanco_patrimonial_${companyName.replace(/ /g, '_')}.pdf`);
}


// --- Full Excel Report ---

interface FullReportData {
  transactions: Transaction[];
  accounts: PayableReceivable[];
  investments: Investment[];
  debts: Debt[];
  financialSummary: {
    netWorth: number;
    totalAssets: number;
    cashBalance: number;
    investmentsCurrentValue: number;
    remainingDebt: number;
  };
}

export const exportFullReportToExcel = (data: FullReportData, companyName: string): void => {
    const workbook = XLSX.utils.book_new();
    const { financialSummary } = data;

    // --- 1. Summary Sheet ---
    const summarySheetData = [
        { "Item": "Balanço Patrimonial", "Valor": "" },
        { "Item": "Patrimônio Líquido", "Valor": financialSummary.netWorth },
        {},
        { "Item": "ATIVOS" },
        { "Item": "  Caixa e Contas", "Valor": financialSummary.cashBalance },
        { "Item": "  Investimentos", "Valor": financialSummary.investmentsCurrentValue },
        { "Item": "TOTAL ATIVOS", "Valor": financialSummary.totalAssets },
        {},
        { "Item": "PASSIVOS" },
        { "Item": "  Dívidas e Empréstimos", "Valor": financialSummary.remainingDebt },
        { "Item": "TOTAL PASSIVOS", "Valor": financialSummary.remainingDebt },
    ];
    const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetData, {skipHeader: true});
    summaryWorksheet['!cols'] = [{wch: 35}, {wch: 20}];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Balanço');
    
    // --- 2. Transactions Sheet ---
    if (data.transactions.length > 0) {
        const transactionsSheetData = data.transactions.map(t => ({
            'Data': new Date(t.date).toLocaleDateString('pt-BR'), 'Descrição': t.description, 'Categoria': t.category, 'Tipo': t.type === 'revenue' ? 'Receita' : 'Despesa', 'Valor': t.amount, 'Método de Pagamento': t.paymentMethod, 'Cliente/Fornecedor': t.clientOrSupplier || ''
        }));
        const transactionsWorksheet = XLSX.utils.json_to_sheet(transactionsSheetData);
        autoSizeColumns(transactionsWorksheet, transactionsSheetData);
        XLSX.utils.book_append_sheet(workbook, transactionsWorksheet, 'Fluxo de Caixa');
    }

    // --- 3. Accounts Payable/Receivable Sheet ---
    if (data.accounts.length > 0) {
        const accountsSheetData = data.accounts.map(a => ({
            'Descrição': a.description, 'Tipo': a.type === 'payable' ? 'A Pagar' : 'A Receber', 'Valor': a.amount, 'Vencimento': new Date(a.dueDate).toLocaleDateString('pt-BR'), 'Status': a.status === 'paid' ? 'Pago' : 'Pendente', 'Cliente/Fornecedor': a.clientOrSupplier || '',
        }));
        const accountsWorksheet = XLSX.utils.json_to_sheet(accountsSheetData);
        autoSizeColumns(accountsWorksheet, accountsSheetData);
        XLSX.utils.book_append_sheet(workbook, accountsWorksheet, 'Contas a Pagar e Receber');
    }

    // --- 4. Investments Sheet ---
    if (data.investments.length > 0) {
        const investmentsSheetData = data.investments.map(i => ({
            'Ativo': i.name, 'Tipo': i.type, 'Quantidade': i.quantity, 'Preço de Compra': i.purchasePrice, 'Preço Atual': i.currentPrice, 'Valor Total': i.currentValue, 'Data da Compra': new Date(i.purchaseDate).toLocaleDateString('pt-BR'), 'Performance (%)': i.performance.toFixed(2)
        }));
        const investmentsWorksheet = XLSX.utils.json_to_sheet(investmentsSheetData);
        autoSizeColumns(investmentsWorksheet, investmentsSheetData);
        XLSX.utils.book_append_sheet(workbook, investmentsWorksheet, 'Investimentos');
    }

    // --- 5. Debts Sheet ---
    if (data.debts.length > 0) {
        const debtsSheetData = data.debts.map(d => ({
            'Dívida': d.name, 'Tipo': d.type, 'Credor': d.lender || '', 'Valor Total': d.totalAmount, 'Valor Pago': d.paidAmount, 'Saldo Devedor': d.remainingAmount, 'Juros Anual (%)': d.interestRate, 'Data de Início': new Date(d.startDate).toLocaleDateString('pt-BR')
        }));
        const debtsWorksheet = XLSX.utils.json_to_sheet(debtsSheetData);
        autoSizeColumns(debtsWorksheet, debtsSheetData);
        XLSX.utils.book_append_sheet(workbook, debtsWorksheet, 'Dívidas e Empréstimos');
    }
    
    XLSX.writeFile(workbook, `Relatorio_Financeiro_${companyName.replace(/ /g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
};