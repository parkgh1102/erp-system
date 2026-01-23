import { Business } from './Business';
import { Customer } from './Customer';
import { PurchaseOrderItem } from './PurchaseOrderItem';
export declare class PurchaseOrder {
    id: number;
    business: Business;
    businessId: number;
    supplier?: Customer;
    supplierId?: number;
    orderNumber: string;
    orderDate: Date;
    deliveryDate: Date;
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
    memo?: string;
    deliveryLocation?: string;
    paymentTerms?: string;
    status: string;
    items: PurchaseOrderItem[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=PurchaseOrder.d.ts.map