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
exports.Purchase = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
let Purchase = class Purchase {
};
exports.Purchase = Purchase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Purchase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", Business_1.Business)
], Purchase.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", Number)
], Purchase.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'supplier_name', nullable: true }),
    __metadata("design:type", String)
], Purchase.prototype, "supplierName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_date' }),
    __metadata("design:type", Date)
], Purchase.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Purchase.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Purchase.prototype, "vatAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Purchase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Purchase.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Purchase.prototype, "updatedAt", void 0);
exports.Purchase = Purchase = __decorate([
    (0, typeorm_1.Entity)('purchases')
], Purchase);
//# sourceMappingURL=Purchase.js.map