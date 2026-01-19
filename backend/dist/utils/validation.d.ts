import Joi from 'joi';
export declare function validate(schema: Joi.ObjectSchema, data: unknown): Joi.ValidationResult<any>;
/**
 * 안전한 parseInt - NaN 방지
 * @param value 변환할 값
 * @param defaultValue NaN일 경우 반환할 기본값 (기본: 0)
 * @returns 변환된 숫자 또는 기본값
 */
export declare function safeParseInt(value: string | number | undefined | null, defaultValue?: number): number;
/**
 * 안전한 parseFloat - NaN 방지
 */
export declare function safeParseFloat(value: string | number | undefined | null, defaultValue?: number): number;
export declare const commonSchemas: {
    id: Joi.NumberSchema<number>;
    page: Joi.NumberSchema<number>;
    limit: Joi.NumberSchema<number>;
    search: Joi.StringSchema<string>;
    businessNumber: Joi.StringSchema<string>;
    amount: Joi.NumberSchema<number>;
    date: Joi.DateSchema<Date>;
};
//# sourceMappingURL=validation.d.ts.map