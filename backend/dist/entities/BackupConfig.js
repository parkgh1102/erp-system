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
exports.BackupConfig = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
let BackupConfig = class BackupConfig {
};
exports.BackupConfig = BackupConfig;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BackupConfig.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business),
    (0, typeorm_1.JoinColumn)({ name: 'business_id' }),
    __metadata("design:type", Business_1.Business)
], BackupConfig.prototype, "business", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'business_id' }),
    __metadata("design:type", Number)
], BackupConfig.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BackupConfig.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: 'daily'
    }),
    __metadata("design:type", String)
], BackupConfig.prototype, "scheduleType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'schedule_time', default: '03:00' }),
    __metadata("design:type", String)
], BackupConfig.prototype, "scheduleTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'schedule_day', nullable: true }),
    __metadata("design:type", Number)
], BackupConfig.prototype, "scheduleDay", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retention_count', default: 7 }),
    __metadata("design:type", Number)
], BackupConfig.prototype, "retentionCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_backup_at', nullable: true }),
    __metadata("design:type", Date)
], BackupConfig.prototype, "lastBackupAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_backup_at', nullable: true }),
    __metadata("design:type", Date)
], BackupConfig.prototype, "nextBackupAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BackupConfig.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BackupConfig.prototype, "updatedAt", void 0);
exports.BackupConfig = BackupConfig = __decorate([
    (0, typeorm_1.Entity)('backup_configs')
], BackupConfig);
//# sourceMappingURL=BackupConfig.js.map