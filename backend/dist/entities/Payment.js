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
exports.Payment = exports.PaymentType = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Customer_1 = require("./Customer");
const Transaction_1 = require("./Transaction");
var PaymentType;
(function (PaymentType) {
    PaymentType["RECEIPT"] = "\uC218\uAE08";
    PaymentType["PAYMENT"] = "\uC785\uAE08";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
let Payment = class Payment {
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Payment.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', comment: '수금/입금일' }),
    __metadata("design:type", Date)
], Payment.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Payment.prototype, "paymentType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Payment.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, comment: '원거래' }),
    __metadata("design:type", Number)
], Payment.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 15, scale: 2, comment: '금액' }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '수금/입금방법' }),
    __metadata("design:type", String)
], Payment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '계좌정보' }),
    __metadata("design:type", String)
], Payment.prototype, "bankAccount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, comment: '적요' }),
    __metadata("design:type", String)
], Payment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '메모' }),
    __metadata("design:type", String)
], Payment.prototype, "memo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.payments),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Payment.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Customer_1.Customer, customer => customer.payments),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", Customer_1.Customer)
], Payment.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Transaction_1.Transaction, transaction => transaction.payments),
    (0, typeorm_1.JoinColumn)({ name: 'transactionId' }),
    __metadata("design:type", Transaction_1.Transaction)
], Payment.prototype, "transaction", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments')
], Payment);
//# sourceMappingURL=Payment.js.map