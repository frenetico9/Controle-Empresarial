export type View = 'dashboard' | 'cashflow' | 'accounts' | 'investments' | 'debts' | 'clients' | 'reports' | 'settings';

export enum PaymentMethod {
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  BANK_TRANSFER = 'Transferência Bancária',
  PIX = 'PIX',
  CASH = 'Dinheiro',
  BOLETO = 'Boleto',
}

export enum Recurrence {
    NONE = 'Não Recorrente',
    WEEKLY = 'Semanal',
    MONTHLY = 'Mensal',
    YEARLY = 'Anual',
}

export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO 8601 format
  category: string;
  description: string;
  type: 'revenue' | 'expense';
  paymentMethod: PaymentMethod;
  recurrence: Recurrence;
  clientOrSupplier?: string;
  notes?: string;
}

export interface PayableReceivable {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // ISO 8601 format
  type: 'payable' | 'receivable';
  status: 'pending' | 'paid';
  clientOrSupplier?: string;
  transactionId?: string | null; // Link to the transaction when paid
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    currency: Currency;
    companyName?: string;
}

export type Currency = 'BRL' | 'USD' | 'EUR';

export enum InvestmentType {
    ACAO = 'Ações Nacionais/Internacionais',
    FII = 'Fundos Imobiliários (FIIs)',
    RENDA_FIXA = 'Renda Fixa (CDB, Tesouro Direto)',
    CRIPTOMOEDA = 'Criptomoedas',
    IMÓVEL = 'Imóvel para Renda/Especulação',
    EQUIPAMENTO = 'Equipamentos (Leasing/Investimento)',
    OUTRO = 'Outro'
}

export interface Investment {
    id: string;
    name: string;
    type: InvestmentType;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: string; // ISO 8601
    // Calculated fields
    currentValue: number;
    performance: number;
}

export enum DebtType {
  FINANCIAMENTO_VEICULO = 'Financiamento de Veículo',
  FINANCIAMENTO_IMOBILIARIO = 'Financiamento Imobiliário',
  EMPRESTIMO_CAPITAL_GIRO = 'Empréstimo para Capital de Giro',
  EMPRESTIMO_INVESTIMENTO = 'Empréstimo para Investimento',
  OUTRO = 'Outra Dívida/Empréstimo'
}

export interface Debt {
    id: string;
    name: string;
    type: DebtType;
    lender?: string; // Credor
    totalAmount: number;
    interestRate: number; // Annual percentage
    startDate: string; // ISO 8601
    // Calculated fields
    paidAmount: number;
    remainingAmount: number;
}

export interface Client {
    name: string;
    totalRevenue: number;
    totalExpense: number;
    transactionCount: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{className?: string}>;
    unlocked: boolean;
}
