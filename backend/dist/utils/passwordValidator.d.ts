import Joi from 'joi';
export declare const validatePasswordStrength: (password: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const passwordValidator: (value: string, helpers: Joi.CustomHelpers) => string | Joi.ErrorReport;
export declare const passwordSchema: Joi.StringSchema<string>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=passwordValidator.d.ts.map