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
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const TransactionItem_1 = require("./TransactionItem");
const SalesItem_1 = require("./SalesItem");
const PurchaseItem_1 = require("./PurchaseItem");
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.products),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Product.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Product.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, comment: '품목명' }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, comment: '품목코드' }),
    __metadata("design:type", String)
], Product.prototype, "productCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '규격' }),
    __metadata("design:type", String)
], Product.prototype, "spec", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, comment: '사양' }),
    __metadata("design:type", String)
], Product.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '단위' }),
    __metadata("design:type", String)
], Product.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true, default: 0, comment: '현재재고' }),
    __metadata("design:type", Number)
], Product.prototype, "currentStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '매입단가' }),
    __metadata("design:type", Number)
], Product.prototype, "buyPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, nullable: true, comment: '매출단가' }),
    __metadata("design:type", Number)
], Product.prototype, "sellPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '분류' }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'tax_separate', comment: '세금구분' }),
    __metadata("design:type", String)
], Product.prototype, "taxType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '비고' }),
    __metadata("design:type", String)
], Product.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TransactionItem_1.TransactionItem, item => item.product),
    __metadata("design:type", Array)
], Product.prototype, "transactionItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SalesItem_1.SalesItem, item => item.product),
    __metadata("design:type", Array)
], Product.prototype, "salesItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PurchaseItem_1.PurchaseItem, item => item.product),
    __metadata("design:type", Array)
], Product.prototype, "purchaseItems", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products')
], Product);
//# sourceMappingURL=Product.js.map