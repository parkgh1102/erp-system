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
exports.Business = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Customer_1 = require("./Customer");
const Product_1 = require("./Product");
const Transaction_1 = require("./Transaction");
const Payment_1 = require("./Payment");
const Invoice_1 = require("./Invoice");
const Note_1 = require("./Note");
let Business = class Business {
};
exports.Business = Business;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Business.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.businesses),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], Business.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Business.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 12, comment: '사업자번호' }),
    __metadata("design:type", String)
], Business.prototype, "businessNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '상호명' }),
    __metadata("design:type", String)
], Business.prototype, "companyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, comment: '대표자명' }),
    __metadata("design:type", String)
], Business.prototype, "representative", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '업태' }),
    __metadata("design:type", String)
], Business.prototype, "businessType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '종목' }),
    __metadata("design:type", String)
], Business.prototype, "businessItem", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, comment: '주소' }),
    __metadata("design:type", String)
], Business.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '전화번호' }),
    __metadata("design:type", String)
], Business.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true, comment: '팩스번호' }),
    __metadata("design:type", String)
], Business.prototype, "fax", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: '이메일' }),
    __metadata("design:type", String)
], Business.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true, comment: '홈페이지' }),
    __metadata("design:type", String)
], Business.prototype, "homepage", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Business.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Business.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Business.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Customer_1.Customer, customer => customer.business),
    __metadata("design:type", Array)
], Business.prototype, "customers", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Product_1.Product, product => product.business),
    __metadata("design:type", Array)
], Business.prototype, "products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Transaction_1.Transaction, transaction => transaction.business),
    __metadata("design:type", Array)
], Business.prototype, "transactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Payment_1.Payment, payment => payment.business),
    __metadata("design:type", Array)
], Business.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Invoice_1.Invoice, invoice => invoice.business),
    __metadata("design:type", Array)
], Business.prototype, "invoices", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Note_1.Note, note => note.business),
    __metadata("design:type", Array)
], Business.prototype, "notes", void 0);
exports.Business = Business = __decorate([
    (0, typeorm_1.Entity)('businesses')
], Business);
//# sourceMappingURL=Business.js.map