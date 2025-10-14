import { Business } from './Business';
import { Customer } from './Customer';
import { Account } from './Account';
import { Payment } from './Payment';
import { Invoice } from './Invoice';
import { TransactionItem } from './TransactionItem';
export declare enum TransactionType {
    PURCHASE = "\uB9E4\uC785",
    SALES = "\uB9E4\uCD9C"
}
export declare class Transaction {
    id: number;
    businessId: number;
    transactionDate: Date;
    transactionType: TransactionType;
    customerId?: number;
    accountId: number;
    description: string;
    supplyAmount: number;
    taxAmount: number;
    totalAmount: number;
    invoiceNumber?: string;
    paymentMethod?: string;
    memo?: string;
    createdBy?: number;
    createdAt: Date;
    updatedAt: Date;
    business: Business;
    customer: Customer;
    account: Account;
    payments: Payment[];
    invoices: Invoice[];
    transactionItems: TransactionItem[];
}
//# sourceMappingURL=Transaction.d.ts.map