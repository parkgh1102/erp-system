import { Sales } from './Sales';
import { Product } from './Product';
export declare class SalesItem {
    id: number;
    sales: Sales;
    salesId: number;
    product?: Product;
    productId?: number;
    itemName: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    supplyAmount: number;
    taxAmount: number;
    specification?: string;
    remark?: string;
    sortOrder: number;
    createdAt: Date;
}
//# sourceMappingURL=SalesItem.d.ts.map