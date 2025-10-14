import { Business } from './Business';
import { Transaction } from './Transaction';
export declare enum InvoiceType {
    TAX_INVOICE = "\uC138\uAE08\uACC4\uC0B0\uC11C",
    INVOICE = "\uACC4\uC0B0\uC11C",
    RECEIPT = "\uC601\uC218\uC99D"
}
export declare enum IssueStatus {
    DRAFT = "\uC791\uC131\uC911",
    ISSUED = "\uBC1C\uD589\uC644\uB8CC",
    SENT = "\uC804\uC1A1\uC644\uB8CC",
    ERROR = "\uC624\uB958"
}
export declare class Invoice {
    id: number;
    businessId: number;
    transactionId: number;
    invoiceType: InvoiceType;
    invoiceNumber: string;
    issueDate: Date;
    supplierBusinessNumber: string;
    supplierName: string;
    buyerBusinessNumber?: string;
    buyerName: string;
    supplyAmount: number;
    taxAmount: number;
    totalAmount: number;
    issueStatus: IssueStatus;
    hometaxId?: string;
    pdfPath?: string;
    createdAt: Date;
    updatedAt: Date;
    business: Business;
    transaction: Transaction;
}
//# sourceMappingURL=Invoice.d.ts.map