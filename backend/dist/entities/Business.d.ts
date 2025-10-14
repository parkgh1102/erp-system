import { User } from './User';
import { Customer } from './Customer';
import { Product } from './Product';
import { Transaction } from './Transaction';
import { Payment } from './Payment';
import { Invoice } from './Invoice';
import { Note } from './Note';
export declare class Business {
    id: number;
    user: User;
    userId: number;
    businessNumber: string;
    companyName: string;
    representative: string;
    businessType?: string;
    businessItem?: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    homepage?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    customers: Customer[];
    products: Product[];
    transactions: Transaction[];
    payments: Payment[];
    invoices: Invoice[];
    notes: Note[];
}
//# sourceMappingURL=Business.d.ts.map