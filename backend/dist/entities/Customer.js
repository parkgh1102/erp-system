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
exports.Customer = exports.CustomerType = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
const Transaction_1 = require("./Transaction");
const Payment_1 = require("./Payment");
var CustomerType;
(function (CustomerType) {
    CustomerType["SALES"] = "\uB9E4\uCD9C\uCC98";
    CustomerType["PURCHASE"] = "\uB9E4\uC785\uCC98";
    CustomerType["OTHER"] = "\uAE30\uD0C0";
})(CustomerType || (exports.CustomerType = CustomerType = {}));
let Customer = class Customer {
};
exports.Customer = Customer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Customer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Customer.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 20, comment: '거래처코드' }),
    __metadata("design:type", String)
], Customer.prototype, "customerCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '거래처명' }),
    __metadata("design:type", String)
], Customer.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12, nullable: true, comment: '사업자번호' }),
    __metadata("design:type", String)
], Customer.prototype, "businessNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '대표자' }),
    __metadata("design:type", String)
], Customer.prototype, "representative", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, comment: '주소' }),
    __metadata("design:type", String)
], Customer.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '전화번호' }),
    __metadata("design:type", String)
], Customer.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '이메일' }),
    __metadata("design:type", String)
], Customer.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: CustomerType.OTHER }),
    __metadata("design:type", String)
], Customer.prototype, "customerType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Customer.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Customer.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Customer.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.customers),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Customer.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Transaction_1.Transaction, transaction => transaction.customer),
    __metadata("design:type", Array)
], Customer.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Payment_1.Payment, payment => payment.customer),
    __metadata("design:type", Array)
], Customer.prototype, "payments", void 0);
exports.Customer = Customer = __decorate([
    (0, typeorm_1.Entity)('customers')
], Customer);
//# sourceMappingURL=Customer.js.map