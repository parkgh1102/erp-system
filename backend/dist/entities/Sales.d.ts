import { Business } from './Business';
import { Customer } from './Customer';
import { SalesItem } from './SalesItem';
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
    items: SalesItem[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Sales.d.ts.map