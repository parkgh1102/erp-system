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
exports.CompanySettings = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
let CompanySettings = class CompanySettings {
};
exports.CompanySettings = CompanySettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CompanySettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], CompanySettings.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CompanySettings.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, comment: '설정 키' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "settingKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', comment: '설정 값' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "settingValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true, comment: '설명' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CompanySettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CompanySettings.prototype, "updatedAt", void 0);
exports.CompanySettings = CompanySettings = __decorate([
    (0, typeorm_1.Entity)('company_settings')
], CompanySettings);
//# sourceMappingURL=CompanySettings.js.map