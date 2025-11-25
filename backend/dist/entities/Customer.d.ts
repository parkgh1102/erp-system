import { Business } from './Business';
import { Transaction } from './Transaction';
import { Payment } from './Payment';
export declare enum CustomerType {
    SALES = "\uB9E4\uCD9C\uCC98",
    PURCHASE = "\uB9E4\uC785\uCC98",
    OTHER = "\uAE30\uD0C0"
}
export declare class Customer {
    id: number;
    businessId: number;
    customerCode: string;
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    managerContact?: string;
    businessType?: string;
    businessItem?: string;
    customerType: CustomerType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    business: Business;
    transactions: Transaction[];
    payments: Payment[];
}
//# sourceMappingURL=Customer.d.ts.map