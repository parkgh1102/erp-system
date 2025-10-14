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
exports.Sales = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Customer_1 = require("./Customer");
const SalesItem_1 = require("./SalesItem");
let Sales = class Sales {
};
exports.Sales = Sales;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Sales.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", Business_1.Business)
], Sales.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", Number)
], Sales.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'customer_id' }),
    __metadata("design:type", Customer_1.Customer)
], Sales.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_id', nullable: true }),
    __metadata("design:type", Number)
], Sales.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'transaction_date' }),
    __metadata("design:type", Date)
], Sales.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sales.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Sales.prototype, "vatAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Sales.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Sales.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SalesItem_1.SalesItem, item => item.sales),
    __metadata("design:type", Array)
], Sales.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Sales.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Sales.prototype, "updatedAt", void 0);
exports.Sales = Sales = __decorate([
    (0, typeorm_1.Entity)('sales')
], Sales);
//# sourceMappingURL=Sales.js.map