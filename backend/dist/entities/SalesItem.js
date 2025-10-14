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
exports.SalesItem = void 0;
const typeorm_1 = require("typeorm");
const Sales_1 = require("./Sales");
const Product_1 = require("./Product");
let SalesItem = class SalesItem {
};
exports.SalesItem = SalesItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SalesItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Sales_1.Sales, sales => sales.items),
    (0, typeorm_1.JoinColumn)({ name: 'salesId' }),
    __metadata("design:type", Sales_1.Sales)
], SalesItem.prototype, "sales", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SalesItem.prototype, "salesId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, product => product.salesItems, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", Product_1.Product)
], SalesItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], SalesItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '품목명' }),
    __metadata("design:type", String)
], SalesItem.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' }),
    __metadata("design:type", Number)
], SalesItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '단위' }),
    __metadata("design:type", String)
], SalesItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '단가' }),
    __metadata("design:type", Number)
], SalesItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '공급가액' }),
    __metadata("design:type", Number)
], SalesItem.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' }),
    __metadata("design:type", Number)
], SalesItem.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '규격' }),
    __metadata("design:type", String)
], SalesItem.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '비고' }),
    __metadata("design:type", String)
], SalesItem.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SalesItem.prototype, "createdAt", void 0);
exports.SalesItem = SalesItem = __decorate([
    (0, typeorm_1.Entity)('sales_items')
], SalesItem);
//# sourceMappingURL=SalesItem.js.map