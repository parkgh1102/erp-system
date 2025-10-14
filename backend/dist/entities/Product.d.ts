import { Business } from './Business';
import { TransactionItem } from './TransactionItem';
import { SalesItem } from './SalesItem';
export declare class Product {
    id: number;
    business: Business;
    businessId: number;
    name: string;
    productCode: string;
    spec?: string;
    unit?: string;
    buyPrice?: number;
    sellPrice?: number;
    category?: string;
    taxType: string;
    memo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    transactionItems: TransactionItem[];
    salesItems: SalesItem[];
}
//# sourceMappingURL=Product.d.ts.map