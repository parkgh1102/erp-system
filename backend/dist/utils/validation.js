"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = void 0;
exports.validate = validate;
const joi_1 = __importDefault(require("joi"));
function validate(schema, data) {
    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
}
exports.commonSchemas = {
    id: joi_1.default.number().integer().positive(),
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    search: joi_1.default.string().max(100).optional(),
    businessNumber: joi_1.default.string().pattern(/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/),
    amount: joi_1.default.number().precision(2).min(0),
    date: joi_1.default.date()
};
//# sourceMappingURL=validation.js.map