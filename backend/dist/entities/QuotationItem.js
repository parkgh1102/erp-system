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
exports.QuotationItem = void 0;
const typeorm_1 = require("typeorm");
const Quotation_1 = require("./Quotation");
const Product_1 = require("./Product");
let QuotationItem = class QuotationItem {
};
exports.QuotationItem = QuotationItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], QuotationItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Quotation_1.Quotation, quotation => quotation.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'quotation_id' }),
    __metadata("design:type", Quotation_1.Quotation)
], QuotationItem.prototype, "quotation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quotation_id' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "quotationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", Product_1.Product)
], QuotationItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', nullable: true }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_name', length: 200, comment: '품목명' }),
    __metadata("design:type", String)
], QuotationItem.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '규격' }),
    __metadata("design:type", String)
], QuotationItem.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '단위' }),
    __metadata("design:type", String)
], QuotationItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'decimal', precision: 15, scale: 2, comment: '단가' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supply_amount', type: 'decimal', precision: 15, scale: 2, comment: '공급가액' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'vat_amount', type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "vatAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '비고' }),
    __metadata("design:type", String)
], QuotationItem.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0, comment: '정렬 순서' }),
    __metadata("design:type", Number)
], QuotationItem.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QuotationItem.prototype, "createdAt", void 0);
exports.QuotationItem = QuotationItem = __decorate([
    (0, typeorm_1.Entity)('quotation_items')
], QuotationItem);
//# sourceMappingURL=QuotationItem.js.map