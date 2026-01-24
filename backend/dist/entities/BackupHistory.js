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
exports.BackupHistory = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
let BackupHistory = class BackupHistory {
};
exports.BackupHistory = BackupHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BackupHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", Business_1.Business)
], BackupHistory.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], BackupHistory.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path' }),
    __metadata("design:type", String)
], BackupHistory.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'pending'
    }),
    __metadata("design:type", String)
], BackupHistory.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'backup_type',
        type: 'varchar',
        length: 20,
        default: 'manual'
    }),
    __metadata("design:type", String)
], BackupHistory.prototype, "backupType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BackupHistory.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customers_count', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "customersCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'products_count', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "productsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sales_count', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "salesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchases_count', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "purchasesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payments_count', default: 0 }),
    __metadata("design:type", Number)
], BackupHistory.prototype, "paymentsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', nullable: true }),
    __metadata("design:type", Date)
], BackupHistory.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BackupHistory.prototype, "createdAt", void 0);
exports.BackupHistory = BackupHistory = __decorate([
    (0, typeorm_1.Entity)('backup_histories')
], BackupHistory);
//# sourceMappingURL=BackupHistory.js.map