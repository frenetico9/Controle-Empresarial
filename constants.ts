import { InvestmentType, DebtType } from "./types";

export const EXPENSE_CATEGORIES = [
  'Fornecedores',
  'Salários e Encargos',
  'Aluguel',
  'Impostos e Taxas',
  'Marketing e Vendas',
  'Infraestrutura (Luz, Água, Internet)',
  'Software e Assinaturas',
  'Manutenção e Reparos',
  'Despesas Administrativas',
  'Pagamento de Empréstimo',
  'Outras Despesas Operacionais'
];

export const INCOME_CATEGORIES = [
    'Venda de Produtos', 
    'Prestação de Serviços', 
    'Juros de Aplicações',
    'Venda de Ativo',
    'Outras Receitas'
];

export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

export const INVESTMENT_TYPES = Object.values(InvestmentType);
export const DEBT_TYPES = Object.values(DebtType);