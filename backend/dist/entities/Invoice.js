"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = exports.IssueStatus = exports.InvoiceType = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Transaction_1 = require("./Transaction");
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["TAX_INVOICE"] = "\uC138\uAE08\uACC4\uC0B0\uC11C";
    InvoiceType["INVOICE"] = "\uACC4\uC0B0\uC11C";
    InvoiceType["RECEIPT"] = "\uC601\uC218\uC99D";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var IssueStatus;
(function (IssueStatus) {
    IssueStatus["DRAFT"] = "\uC791\uC131\uC911";
    IssueStatus["ISSUED"] = "\uBC1C\uD589\uC644\uB8CC";
    IssueStatus["SENT"] = "\uC804\uC1A1\uC644\uB8CC";
    IssueStatus["ERROR"] = "\uC624\uB958";
})(IssueStatus || (exports.IssueStatus = IssueStatus = {}));
let Invoice = class Invoice {
};
exports.Invoice = Invoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Invoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Invoice.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Invoice.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50, comment: '계산서번호' }),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', comment: '발행일자' }),
    __metadata("design:type", Date)
], Invoice.prototype, "issueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12, comment: '공급자 사업자번호' }),
    __metadata("design:type", String)
], Invoice.prototype, "supplierBusinessNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '공급자명' }),
    __metadata("design:type", String)
], Invoice.prototype, "supplierName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12, nullable: true, comment: '공급받는자 사업자번호' }),
    __metadata("design:type", String)
], Invoice.prototype, "buyerBusinessNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '공급받는자명' }),
    __metadata("design:type", String)
], Invoice.prototype, "buyerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '공급가액' }),
    __metadata("design:type", Number)
], Invoice.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '세액' }),
    __metadata("design:type", Number)
], Invoice.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '합계액' }),
    __metadata("design:type", Number)
], Invoice.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: IssueStatus.DRAFT }),
    __metadata("design:type", String)
], Invoice.prototype, "issueStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '홈택스 승인번호' }),
    __metadata("design:type", String)
], Invoice.prototype, "hometaxId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, comment: 'PDF 파일 경로' }),
    __metadata("design:type", String)
], Invoice.prototype, "pdfPath", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Invoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Invoice.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.invoices),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Invoice.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Transaction_1.Transaction, transaction => transaction.invoices),
    (0, typeorm_1.JoinColumn)({ name: 'transactionId' }),
    __metadata("design:type", Transaction_1.Transaction)
], Invoice.prototype, "transaction", void 0);
exports.Invoice = Invoice = __decorate([
    (0, typeorm_1.Entity)('invoices')
], Invoice);
//# sourceMappingURL=Invoice.js.map