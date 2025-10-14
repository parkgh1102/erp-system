import Joi from 'joi';
export declare function validate(schema: Joi.ObjectSchema, data: unknown): Joi.ValidationResult<any>;
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