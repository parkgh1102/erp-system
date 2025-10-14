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
exports.Transaction = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Customer_1 = require("./Customer");
const Account_1 = require("./Account");
const Payment_1 = require("./Payment");
const Invoice_1 = require("./Invoice");
const TransactionItem_1 = require("./TransactionItem");
var TransactionType;
(function (TransactionType) {
    TransactionType["PURCHASE"] = "\uB9E4\uC785";
    TransactionType["SALES"] = "\uB9E4\uCD9C";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Transaction.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', comment: '거래일자' }),
    __metadata("design:type", Date)
], Transaction.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Transaction.prototype, "transactionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Transaction.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Transaction.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, comment: '적요' }),
    __metadata("design:type", String)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '공급가액' }),
    __metadata("design:type", Number)
], Transaction.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' }),
    __metadata("design:type", Number)
], Transaction.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '합계액' }),
    __metadata("design:type", Number)
], Transaction.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '계산서번호' }),
    __metadata("design:type", String)
], Transaction.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '결제방법' }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '메모' }),
    __metadata("design:type", String)
], Transaction.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, comment: '입력자' }),
    __metadata("design:type", Number)
], Transaction.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Transaction.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, customer => customer.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", Customer_1.Customer)
], Transaction.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Account_1.Account),
    (0, typeorm_1.JoinColumn)({ name: 'accountId' }),
    __metadata("design:type", Account_1.Account)
], Transaction.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Payment_1.Payment, payment => payment.transaction),
    __metadata("design:type", Array)
], Transaction.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Invoice_1.Invoice, invoice => invoice.transaction),
    __metadata("design:type", Array)
], Transaction.prototype, "invoices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TransactionItem_1.TransactionItem, item => item.transaction),
    __metadata("design:type", Array)
], Transaction.prototype, "transactionItems", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions')
], Transaction);
//# sourceMappingURL=Transaction.js.map