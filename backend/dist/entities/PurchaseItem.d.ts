import { Purchase } from './Purchase';
import { Product } from './Product';
export declare class PurchaseItem {
    id: number;
    purchase: Purchase;
    purchaseId: number;
    product?: Product;
    productId?: number;
    productCode?: string;
    productName: string;
    spec?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    sortOrder: number;
    createdAt: Date;
}
//# sourceMappingURL=PurchaseItem.d.ts.map