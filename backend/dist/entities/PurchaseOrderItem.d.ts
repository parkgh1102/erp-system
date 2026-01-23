import { PurchaseOrder } from './PurchaseOrder';
import { Product } from './Product';
export declare class PurchaseOrderItem {
    id: number;
    purchaseOrder: PurchaseOrder;
    purchaseOrderId: number;
    product?: Product;
    productId?: number;
    itemName: string;
    specification?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    supplyAmount: number;
    vatAmount: number;
    remark?: string;
    sortOrder: number;
    createdAt: Date;
}
//# sourceMappingURL=PurchaseOrderItem.d.ts.map