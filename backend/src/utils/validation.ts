import Joi from 'joi';

export function validate(schema: Joi.ObjectSchema, data: unknown) {
  return schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
}

/**
 * 안전한 parseInt - NaN 방지
 * @param value 변환할 값
 * @param defaultValue NaN일 경우 반환할 기본값 (기본: 0)
 * @returns 변환된 숫자 또는 기본값
 */
export function safeParseInt(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 안전한 parseFloat - NaN 방지
 */
export function safeParseFloat(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
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