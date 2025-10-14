import { Transaction } from './Transaction';
import { Product } from './Product';
export declare class TransactionItem {
    id: number;
    transaction: Transaction;
    transactionId: number;
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
    createdAt: Date;
}
//# sourceMappingURL=TransactionItem.d.ts.map