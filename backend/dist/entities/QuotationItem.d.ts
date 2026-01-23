import { Quotation } from './Quotation';
import { Product } from './Product';
export declare class QuotationItem {
    id: number;
    quotation: Quotation;
    quotationId: number;
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
//# sourceMappingURL=QuotationItem.d.ts.map