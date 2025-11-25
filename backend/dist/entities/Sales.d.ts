import { Business } from './Business';
import { Customer } from './Customer';
import { SalesItem } from './SalesItem';
import { User } from './User';
export declare class Sales {
    id: number;
    business: Business;
    businessId: number;
    customer?: Customer;
    customerId?: number;
    transactionDate: Date;
    totalAmount: number;
    vatAmount: number;
    description?: string;
    memo?: string;
    signedByUser?: User;
    signedBy?: number;
    signedAt?: Date;
    signatureImage?: string;
    items: SalesItem[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Sales.d.ts.map