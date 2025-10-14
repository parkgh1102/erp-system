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
exports.TransactionItem = void 0;
const typeorm_1 = require("typeorm");
const Transaction_1 = require("./Transaction");
const Product_1 = require("./Product");
let TransactionItem = class TransactionItem {
};
exports.TransactionItem = TransactionItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TransactionItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Transaction_1.Transaction, transaction => transaction.transactionItems),
    (0, typeorm_1.JoinColumn)({ name: 'transactionId' }),
    __metadata("design:type", Transaction_1.Transaction)
], TransactionItem.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TransactionItem.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product_1.Product, product => product.transactionItems, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", Product_1.Product)
], TransactionItem.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TransactionItem.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '품목명' }),
    __metadata("design:type", String)
], TransactionItem.prototype, "itemName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '수량' }),
    __metadata("design:type", Number)
], TransactionItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '단위' }),
    __metadata("design:type", String)
], TransactionItem.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '단가' }),
    __metadata("design:type", Number)
], TransactionItem.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '공급가액' }),
    __metadata("design:type", Number)
], TransactionItem.prototype, "supplyAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '세액' }),
    __metadata("design:type", Number)
], TransactionItem.prototype, "taxAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '규격' }),
    __metadata("design:type", String)
], TransactionItem.prototype, "specification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '비고' }),
    __metadata("design:type", String)
], TransactionItem.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TransactionItem.prototype, "createdAt", void 0);
exports.TransactionItem = TransactionItem = __decorate([
    (0, typeorm_1.Entity)('transaction_items')
], TransactionItem);
//# sourceMappingURL=TransactionItem.js.map