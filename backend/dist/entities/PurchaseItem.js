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
exports.PurchaseItem = void 0;
const typeorm_1 = require("typeorm");
const Purchase_1 = require("./Purchase");
const Product_1 = require("./Product");
let PurchaseItem = class PurchaseItem {
};
exports.PurchaseItem = PurchaseItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Purchase_1.Purchase, purchase => purchase.items),
    (0, typeorm_1.JoinColumn)({ name: 'purchaseId' }),
    __metadata("design:type", Purchase_1.Purchase)
], PurchaseItem.prototype, "purchase", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, product => product.purchaseItems, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", Product_1.Product)
], PurchaseItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '품목코드' }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "productCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '품목명' }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "productName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '규격' }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "spec", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '단위' }),
    __metadata("design:type", String)
], PurchaseItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '단가' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '금액' }),
    __metadata("design:type", Number)
], PurchaseItem.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PurchaseItem.prototype, "createdAt", void 0);
exports.PurchaseItem = PurchaseItem = __decorate([
    (0, typeorm_1.Entity)('purchase_items')
], PurchaseItem);
//# sourceMappingURL=PurchaseItem.js.map