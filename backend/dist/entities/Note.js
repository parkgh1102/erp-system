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
exports.Note = exports.NoteType = void 0;
const typeorm_1 = require("typeorm");
const Business_1 = require("./Business");
var NoteType;
(function (NoteType) {
    NoteType["GENERAL"] = "\uC77C\uBC18";
    NoteType["TRANSACTION"] = "\uAC70\uB798\uAD00\uB828";
    NoteType["CUSTOMER"] = "\uACE0\uAC1D\uAD00\uB828";
})(NoteType || (exports.NoteType = NoteType = {}));
let Note = class Note {
};
exports.Note = Note;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Note.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Note.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, comment: '제목' }),
    __metadata("design:type", String)
], Note.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '내용' }),
    __metadata("design:type", String)
], Note.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: NoteType.GENERAL }),
    __metadata("design:type", String)
], Note.prototype, "noteType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, comment: '관련 레코드 ID' }),
    __metadata("design:type", Number)
], Note.prototype, "relatedId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: '관련 테이블명' }),
    __metadata("design:type", String)
], Note.prototype, "relatedType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '태그 (JSON)' }),
    __metadata("design:type", String)
], Note.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, comment: '작성자' }),
    __metadata("design:type", Number)
], Note.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Note.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Note.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Business_1.Business, business => business.notes),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", Business_1.Business)
], Note.prototype, "business", void 0);
exports.Note = Note = __decorate([
    (0, typeorm_1.Entity)('notes')
], Note);
//# sourceMappingURL=Note.js.map