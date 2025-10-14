import Joi from 'joi';

export function validate(schema: Joi.ObjectSchema, data: unknown) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

export const commonSchemas = {
  id: Joi.number().integer().positive(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).optional(),
  businessNumber: Joi.string().pattern(/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/),
  amount: Joi.number().precision(2).min(0),
  date: Joi.date()
};