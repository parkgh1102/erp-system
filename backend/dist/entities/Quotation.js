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
exports.Quotation = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Customer_1 = require("./Customer");
const QuotationItem_1 = require("./QuotationItem");
let Quotation = class Quotation {
};
exports.Quotation = Quotation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Quotation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", Business_1.Business)
], Quotation.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", Number)
], Quotation.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", Customer_1.Customer)
], Quotation.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', nullable: true }),
    __metadata("design:type", Number)
], Quotation.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quotation_number', length: 50, comment: '견적번호' }),
    __metadata("design:type", String)
], Quotation.prototype, "quotationNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quotation_date', comment: '견적일자' }),
    __metadata("design:type", Date)
], Quotation.prototype, "quotationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_until', comment: '유효기간' }),
    __metadata("design:type", Date)
], Quotation.prototype, "validUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '공급가액 합계' }),
    __metadata("design:type", Number)
], Quotation.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액 합계' }),
    __metadata("design:type", Number)
], Quotation.prototype, "vatAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '총액' }),
    __metadata("design:type", Number)
], Quotation.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '비고' }),
    __metadata("design:type", String)
], Quotation.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_terms', length: 200, nullable: true, comment: '결제조건' }),
    __metadata("design:type", String)
], Quotation.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_terms', length: 200, nullable: true, comment: '납품조건' }),
    __metadata("design:type", String)
], Quotation.prototype, "deliveryTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'draft', comment: '상태 (draft, sent, accepted, rejected, expired)' }),
    __metadata("design:type", String)
], Quotation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => QuotationItem_1.QuotationItem, item => item.quotation, { cascade: true }),
    __metadata("design:type", Array)
], Quotation.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Quotation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Quotation.prototype, "updatedAt", void 0);
exports.Quotation = Quotation = __decorate([
    (0, typeorm_1.Entity)('quotations')
], Quotation);
//# sourceMappingURL=Quotation.js.map