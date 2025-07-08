import { Pool } from '@neondatabase/serverless';
import { PaymentMethod, Recurrence, InvestmentType, DebtType } from '../types';
import type { User, Transaction, PayableReceivable, Currency, Investment, Debt } from '../types';

// --- DATABASE CONNECTION SETUP ---
const NEON_CONNECTION_STRING = 'postgresql://neondb_owner:npg_0U4vTxiYXbkw@ep-jolly-frog-ac44o9z7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({ connectionString: NEON_CONNECTION_STRING });

let isDbInitialized = false;

// --- INITIALIZATION & MIGRATION ---
async function initializeDatabase() {
  if (isDbInitialized) return;
  console.log('Ensuring database schema is up-to-date for business version...');

  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Core Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_url TEXT,
        currency TEXT NOT NULL DEFAULT 'BRL',
        company_name TEXT
      );
    `);
    
    // Drop personal finance tables if they exist
    await pool.query(`DROP TABLE IF EXISTS budget_envelopes CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS goals CASCADE;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL, -- 'revenue' or 'expense'
        payment_method TEXT NOT NULL,
        recurrence TEXT NOT NULL,
        client_or_supplier TEXT,
        notes TEXT
      );
    `);
    
    await pool.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS tags;`);
    await pool.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS envelope_id;`);

    // This ensures the column exists on both new and old schemas before the constraint is added.
    await pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS debt_payment_for_id UUID;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts_payable_receivable (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        due_date TIMESTAMP WITH TIME ZONE NOT NULL,
        type TEXT NOT NULL, -- 'payable' or 'receivable'
        status TEXT NOT NULL, -- 'pending' or 'paid'
        client_or_supplier TEXT,
        transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS investments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity NUMERIC(18, 8) NOT NULL,
        purchase_price NUMERIC(12, 2) NOT NULL,
        current_price NUMERIC(12, 2) NOT NULL,
        purchase_date TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS debts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        lender TEXT,
        total_amount NUMERIC(12, 2) NOT NULL,
        interest_rate NUMERIC(5, 2) NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    
    // Add foreign key constraint from transactions to debts after debts table exists
    // Making it idempotent by dropping first if it exists.
    await pool.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_debt_payment;`);
    await pool.query(`
      ALTER TABLE transactions
      ADD CONSTRAINT fk_debt_payment
      FOREIGN KEY (debt_payment_for_id) 
      REFERENCES debts(id) ON DELETE SET NULL;
    `);

    console.log('Schema verification complete.');
    await seedInitialData();
    isDbInitialized = true;
  } catch (e: any) {
    // Ignore "already exists" errors during concurrent initialization
    if (e.code !== '42P07' && e.code !== '23505') {
       console.error('Database initialization failed.', e);
       throw e;
    }
  }
}

async function ensureDbInitialized() {
  if (!isDbInitialized) {
    await initializeDatabase();
  }
}

// --- SEEDING ---
async function seedInitialData() {
    const { rows: seedCheck } = await pool.query("SELECT id FROM users WHERE email = $1", ['empresa@email.com']);
    if (seedCheck.length > 0) return;

    console.log('Seeding initial data for user empresa@email.com...');
    const { rows: userRows } = await pool.query(
        "INSERT INTO users (name, email, password_hash, currency, company_name) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        ['Gestor Principal', 'empresa@email.com', '123', 'BRL', 'Tech Solutions Ltda']
    );
    const userId = userRows[0].id;

    // Seed Transactions
    const sampleTransactions = [
      { amount: 7500.00, date: new Date(new Date().setDate(5)).toISOString(), category: 'Prestação de Serviços', description: 'Desenvolvimento de site - Cliente A', type: 'revenue', paymentMethod: PaymentMethod.BANK_TRANSFER, recurrence: Recurrence.NONE, clientOrSupplier: 'Cliente A' },
      { amount: 1200.00, date: new Date(new Date().setDate(1)).toISOString(), category: 'Aluguel', description: 'Aluguel do escritório', type: 'expense', paymentMethod: PaymentMethod.BANK_TRANSFER, recurrence: Recurrence.MONTHLY, clientOrSupplier: 'Imobiliária Central' },
      { amount: 350.00, date: new Date(new Date().setDate(10)).toISOString(), category: 'Infraestrutura (Luz, Água, Internet)', description: 'Conta de Energia Elétrica', type: 'expense', paymentMethod: PaymentMethod.BOLETO, recurrence: Recurrence.MONTHLY, clientOrSupplier: 'Companhia de Energia' },
      { amount: 450.00, date: new Date(new Date().setDate(15)).toISOString(), category: 'Fornecedores', description: 'Compra de material de escritório', type: 'expense', paymentMethod: PaymentMethod.CREDIT_CARD, recurrence: Recurrence.NONE, clientOrSupplier: 'Papelaria ABC' },
      { amount: 5000.00, date: new Date(new Date().setDate(20)).toISOString(), category: 'Venda de Produtos', description: 'Venda de 10 licenças de software', type: 'revenue', paymentMethod: PaymentMethod.PIX, recurrence: Recurrence.NONE, clientOrSupplier: 'Empresa XYZ' },
    ];
    for (const tx of sampleTransactions) {
      await pool.query(
          'INSERT INTO transactions (user_id, amount, date, category, description, type, payment_method, recurrence, client_or_supplier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [userId, tx.amount, tx.date, tx.category, tx.description, tx.type, tx.paymentMethod, tx.recurrence, tx.clientOrSupplier]
      );
    }
    
    // Seed Accounts Payable/Receivable
    await pool.query(`INSERT INTO accounts_payable_receivable (user_id, description, amount, due_date, type, status, client_or_supplier) VALUES 
      ($1, 'Pagamento Fornecedor de Software', 1500.00, $2, 'payable', 'pending', 'Software Inc.'),
      ($1, 'Recebimento Cliente B - Parcela 1/3', 2500.00, $3, 'receivable', 'pending', 'Cliente B')
    `, [userId, new Date(new Date().setDate(25)).toISOString(), new Date(new Date().setDate(28)).toISOString()]);

    // Seed Investments
    await pool.query(`INSERT INTO investments (user_id, name, type, quantity, purchase_price, current_price, purchase_date) VALUES
      ($1, 'ITSA4', $2, 1000, 9.80, 10.50, '2023-01-15T12:00:00Z'),
      ($1, 'CDB Liquidez Diária', $3, 1, 20000, 21500, '2023-03-20T12:00:00Z')
    `, [userId, InvestmentType.ACAO, InvestmentType.RENDA_FIXA]);

    // Seed Debts
    const { rows: debtRows } = await pool.query(`INSERT INTO debts (user_id, name, type, lender, total_amount, interest_rate, start_date) VALUES
      ($1, 'Financiamento do Veículo da Empresa', $2, 'Banco XYZ', 50000, 12.5, '2023-02-01T12:00:00Z') RETURNING id
    `, [userId, DebtType.FINANCIAMENTO_VEICULO]);
    const debtId = debtRows[0].id;

    // Seed a payment for the debt
    await pool.query(`INSERT INTO transactions (user_id, amount, date, category, description, type, payment_method, recurrence, client_or_supplier, debt_payment_for_id) VALUES 
      ($1, 1250.00, $2, 'Pagamento de Empréstimo', 'Parcela 1/36 Financiamento Veículo', 'expense', $3, $4, 'Banco XYZ', $5)
    `, [userId, new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), PaymentMethod.BOLETO, Recurrence.MONTHLY, debtId]);
    
    console.log('Data seeding complete.');
}


// --- MAPPERS ---
const mapToUser = (r: any): User => ({ id: r.id, email: r.email, name: r.name, avatarUrl: r.avatar_url, currency: r.currency, companyName: r.company_name });
const mapToTransaction = (r: any): Transaction => ({ id: r.id, amount: Number(r.amount), date: new Date(r.date).toISOString(), category: r.category, description: r.description, type: r.type, paymentMethod: r.payment_method, recurrence: r.recurrence, clientOrSupplier: r.client_or_supplier, notes: r.notes });
const mapToPayableReceivable = (r: any): PayableReceivable => ({ id: r.id, description: r.description, amount: Number(r.amount), dueDate: new Date(r.due_date).toISOString(), type: r.type, status: r.status, clientOrSupplier: r.client_or_supplier, transactionId: r.transaction_id });
const mapToInvestment = (r: any): Investment => {
    const purchasePrice = Number(r.purchase_price);
    const currentPrice = Number(r.current_price);
    const quantity = Number(r.quantity);
    const currentValue = currentPrice * quantity;
    const purchaseValue = purchasePrice * quantity;
    const performance = purchaseValue > 0 ? ((currentValue / purchaseValue) - 1) * 100 : 0;
    return { id: r.id, name: r.name, type: r.type, quantity, purchasePrice, currentPrice, purchaseDate: new Date(r.purchase_date).toISOString(), currentValue, performance };
};

// --- GENERIC CRUD ---
const createGetByUserId = <T>(tableName: string, mapper: (row: any) => T) => async (userId: string): Promise<T[]> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE user_id = $1 ORDER BY id`, [userId]);
    return rows.map(mapper);
};

const createDelete = (tableName: string) => async (itemId: string): Promise<boolean> => {
    await ensureDbInitialized();
    const { rowCount } = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [itemId]);
    return typeof rowCount === 'number' && rowCount > 0;
};


// --- API EXPORTS ---

// User & Auth
export const login = async (email: string, pass: string): Promise<User | null> => {
  await ensureDbInitialized();
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = $1 AND password_hash = $2', [email.toLowerCase(), pass]);
  return rows.length > 0 ? mapToUser(rows[0]) : null;
};

export const register = async (name: string, email: string, pass: string): Promise<{user: User | null, error?: string}> => {
  await ensureDbInitialized();
  try {
    const { rows } = await pool.query('INSERT INTO users (name, email, password_hash, company_name) VALUES ($1, $2, $3, $4) RETURNING *', [name, email.toLowerCase(), pass, `${name}'s Company`]);
    return { user: mapToUser(rows[0]) };
  } catch (e: any) {
    return e.code === '23505' ? { user: null, error: 'Este e-mail já está cadastrado.' } : Promise.reject(e);
  }
};

export const updateUserCurrency = async (userId: string, currency: Currency): Promise<User> => {
    await ensureDbInitialized();
    const { rows } = await pool.query('UPDATE users SET currency = $1 WHERE id = $2 RETURNING *', [currency, userId]);
    return mapToUser(rows[0]);
}

export const updateUserProfile = async (userId: string, data: { name: string; email: string; avatarUrl?: string; companyName?: string }): Promise<{user: User | null, error?: string}> => {
    await ensureDbInitialized();
    try {
        const { rows } = await pool.query(
            'UPDATE users SET name = $1, email = $2, avatar_url = COALESCE($3, avatar_url), company_name = COALESCE($4, company_name) WHERE id = $5 RETURNING *',
            [data.name, data.email.toLowerCase(), data.avatarUrl, data.companyName, userId]
        );
        return rows.length > 0 ? { user: mapToUser(rows[0]) } : { user: null, error: 'Usuário não encontrado.' };
    } catch (e: any) {
        return e.code === '23505' ? { user: null, error: 'Este e-mail já está em uso.' } : Promise.reject(e);
    }
}

// Transactions
export const getTransactions = createGetByUserId('transactions', mapToTransaction);
export const addTransaction = async (userId: string, tx: Omit<Transaction, 'id'> & {debtPaymentForId?: string}): Promise<Transaction> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        'INSERT INTO transactions (user_id, amount, date, category, description, type, payment_method, recurrence, client_or_supplier, notes, debt_payment_for_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [userId, tx.amount, tx.date, tx.category, tx.description, tx.type, tx.paymentMethod, tx.recurrence, tx.clientOrSupplier, tx.notes, (tx as any).debtPaymentForId]
    );
    return mapToTransaction(rows[0]);
}
export const updateTransaction = async (txId: string, tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        'UPDATE transactions SET amount = $1, date = $2, category = $3, description = $4, type = $5, payment_method = $6, recurrence = $7, client_or_supplier = $8, notes = $9 WHERE id = $10 RETURNING *',
        [tx.amount, tx.date, tx.category, tx.description, tx.type, tx.paymentMethod, tx.recurrence, tx.clientOrSupplier, tx.notes, txId]
    );
    return mapToTransaction(rows[0]);
}
export const deleteTransaction = createDelete('transactions');

// Accounts Payable & Receivable
export const getAccounts = createGetByUserId('accounts_payable_receivable', mapToPayableReceivable);
export const addAccount = async (userId: string, acc: Omit<PayableReceivable, 'id' | 'status'>): Promise<PayableReceivable> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        "INSERT INTO accounts_payable_receivable (user_id, description, amount, due_date, type, status, client_or_supplier) VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *",
        [userId, acc.description, acc.amount, acc.dueDate, acc.type, acc.clientOrSupplier]
    );
    return mapToPayableReceivable(rows[0]);
}
export const updateAccount = async (accId: string, acc: Omit<PayableReceivable, 'id' | 'status'>): Promise<PayableReceivable> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        "UPDATE accounts_payable_receivable SET description = $1, amount = $2, due_date = $3, type = $4, client_or_supplier = $5 WHERE id = $6 RETURNING *",
        [acc.description, acc.amount, acc.dueDate, acc.type, acc.clientOrSupplier, accId]
    );
    return mapToPayableReceivable(rows[0]);
}
export const deleteAccount = createDelete('accounts_payable_receivable');

export const toggleAccountStatus = async (accountId: string, newStatus: 'paid' | 'pending'): Promise<PayableReceivable> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        "UPDATE accounts_payable_receivable SET status = $1 WHERE id = $2 RETURNING *",
        [newStatus, accountId]
    );
    return mapToPayableReceivable(rows[0]);
}


// Investments
export const getInvestments = createGetByUserId('investments', mapToInvestment);
export const addInvestment = async (userId: string, inv: Omit<Investment, 'id' | 'currentValue' | 'performance'>): Promise<Investment> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        'INSERT INTO investments (user_id, name, type, quantity, purchase_price, current_price, purchase_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, inv.name, inv.type, inv.quantity, inv.purchasePrice, inv.currentPrice, inv.purchaseDate]
    );
    return mapToInvestment(rows[0]);
}
export const updateInvestment = async (invId: string, inv: Omit<Investment, 'id' | 'currentValue' | 'performance'>): Promise<Investment> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        'UPDATE investments SET name = $1, type = $2, quantity = $3, purchase_price = $4, current_price = $5, purchase_date = $6 WHERE id = $7 RETURNING *',
        [inv.name, inv.type, inv.quantity, inv.purchasePrice, inv.currentPrice, inv.purchaseDate, invId]
    );
    return mapToInvestment(rows[0]);
}
export const deleteInvestment = createDelete('investments');

// Debts
export const getDebts = async (userId: string): Promise<Debt[]> => {
    await ensureDbInitialized();
    const { rows: debtRows } = await pool.query('SELECT * FROM debts WHERE user_id = $1', [userId]);
    const { rows: paymentRows } = await pool.query('SELECT debt_payment_for_id, SUM(amount) as total_paid FROM transactions WHERE user_id = $1 AND debt_payment_for_id IS NOT NULL GROUP BY debt_payment_for_id', [userId]);
    
    const paymentsMap = new Map<string, number>();
    paymentRows.forEach(p => paymentsMap.set(p.debt_payment_for_id, Number(p.total_paid)));

    return debtRows.map(d => {
        const totalAmount = Number(d.total_amount);
        const paidAmount = paymentsMap.get(d.id) || 0;
        return {
            id: d.id,
            name: d.name,
            type: d.type,
            lender: d.lender,
            totalAmount,
            interestRate: Number(d.interest_rate),
            startDate: new Date(d.start_date).toISOString(),
            paidAmount,
            remainingAmount: totalAmount - paidAmount,
        };
    });
};
export const addDebt = async (userId: string, debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'>): Promise<Debt> => {
    await ensureDbInitialized();
    const { rows } = await pool.query(
        'INSERT INTO debts (user_id, name, type, lender, total_amount, interest_rate, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, debt.name, debt.type, debt.lender, debt.totalAmount, debt.interestRate, debt.startDate]
    );
    const newDebt = rows[0];
    return { ...newDebt, paidAmount: 0, remainingAmount: Number(newDebt.total_amount), startDate: new Date(newDebt.start_date).toISOString() };
}
export const updateDebt = async (debtId: string, debt: Omit<Debt, 'id' | 'paidAmount' | 'remainingAmount'> & { userId: string }): Promise<Debt> => {
    await ensureDbInitialized();
    await pool.query(
        'UPDATE debts SET name = $1, type = $2, lender = $3, total_amount = $4, interest_rate = $5, start_date = $6 WHERE id = $7',
        [debt.name, debt.type, debt.lender, debt.totalAmount, debt.interestRate, debt.startDate, debtId]
    );
    // Refetch the debt to get recalculated values
    const allDebts = await getDebts(debt.userId);
    return allDebts.find(d => d.id === debtId)!;
}
export const deleteDebt = createDelete('debts');


// --- Combined Data Fetcher ---
export const getAllUserData = async (userId: string) => {
    await ensureDbInitialized();
    const [transactions, accounts, investments, debts] = await Promise.all([
        getTransactions(userId),
        getAccounts(userId),
        getInvestments(userId),
        getDebts(userId),
    ]);
    return { transactions, accounts, investments, debts };
};