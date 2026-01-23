import { Business } from './Business';
import { Customer } from './Customer';
import { QuotationItem } from './QuotationItem';
export declare class Quotation {
    id: number;
    business: Business;
    businessId: number;
    customer?: Customer;
    customerId?: number;
    quotationNumber: string;
    quotationDate: Date;
    validUntil: Date;
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
    memo?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
    status: string;
    items: QuotationItem[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Quotation.d.ts.map