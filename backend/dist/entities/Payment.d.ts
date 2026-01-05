import { Business } from './Business';
import { Customer } from './Customer';
import { Transaction } from './Transaction';
export declare enum PaymentType {
    RECEIPT = "\uC218\uAE08",
    PAYMENT = "\uC9C0\uAE09"
}
export declare class Payment {
    id: number;
    businessId: number;
    paymentDate: Date;
    paymentType: PaymentType;
    customerId: number;
    transactionId?: number;
    amount: number;
    paymentMethod?: string;
    bankAccount?: string;
    description?: string;
    memo?: string;
    createdAt: Date;
    updatedAt: Date;
    business: Business;
    customer: Customer;
    transaction: Transaction;
}
//# sourceMappingURL=Payment.d.ts.map