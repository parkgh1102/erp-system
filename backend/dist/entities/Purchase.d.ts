import { Business } from './Business';
import { Customer } from './Customer';
import { PurchaseItem } from './PurchaseItem';
export declare class Purchase {
    id: number;
    business: Business;
    businessId: number;
    customer?: Customer;
    customerId?: number;
    items: PurchaseItem[];
    purchaseDate: Date;
    totalAmount: number;
    vatAmount: number;
    memo?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Purchase.d.ts.map