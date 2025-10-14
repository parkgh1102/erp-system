"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.passwordSchema = exports.passwordValidator = exports.validatePasswordStrength = void 0;
const joi_1 = __importDefault(require("joi"));
// 흔한 비밀번호 패턴
const COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    '111111', '123123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];
// 연속된 문자 체크 (4개 이상 연속일 때만)
const hasSequentialChars = (password) => {
    const sequential = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    for (const seq of sequential) {
        for (let i = 0; i <= seq.length - 4; i++) { // 4자 이상 연속만 체크
            if (password.toLowerCase().includes(seq.substring(i, i + 4))) {
                return true;
            }
        }
        // 역순도 체크
        const reversed = seq.split('').reverse().join('');
        for (let i = 0; i <= reversed.length - 4; i++) {
            if (password.toLowerCase().includes(reversed.substring(i, i + 4))) {
                return true;
            }
        }
    }
    return false;
};
// 반복 문자 체크
const hasRepeatingChars = (password) => {
    const repeats = /(.)\1{2,}/; // 같은 문자 3번 이상 반복
    return repeats.test(password);
};
// 키보드 패턴 체크
const hasKeyboardPattern = (password) => {
    const patterns = [
        'qwer', 'asdf', 'zxcv', '1234', '4567', '7890',
        'qwerty', 'asdfgh', 'zxcvbn'
    ];
    const lower = password.toLowerCase();
    return patterns.some(pattern => lower.includes(pattern));
};
// 흔한 비밀번호 체크
const isCommonPassword = (password) => {
    return COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common.toLowerCase()));
};
const validatePasswordStrength = (password) => {
    const errors = [];
    // 기본 요구사항 체크
    if (password.length < 8) {
        errors.push('비밀번호는 최소 8자 이상이어야 합니다');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('대문자를 포함해야 합니다');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('소문자를 포함해야 합니다');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('숫자를 포함해야 합니다');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('특수문자(!@#$%^&* 등)를 포함해야 합니다');
    }
    // 고급 보안 체크
    if (isCommonPassword(password)) {
        errors.push('흔한 비밀번호 패턴을 사용할 수 없습니다');
    }
    if (hasSequentialChars(password)) {
        errors.push('4자 이상 연속된 문자(abcd, 1234 등)를 사용할 수 없습니다');
    }
    if (hasRepeatingChars(password)) {
        errors.push('같은 문자를 연속으로 3번 이상 사용할 수 없습니다');
    }
    if (hasKeyboardPattern(password)) {
        errors.push('키보드 패턴(qwer, asdf 등)을 사용할 수 없습니다');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePasswordStrength = validatePasswordStrength;
// Joi 스키마에서 사용할 비밀번호 검증 함수
const passwordValidator = (value, helpers) => {
    const validation = (0, exports.validatePasswordStrength)(value);
    if (!validation.isValid) {
        return helpers.error('password.invalid', {
            message: validation.errors.join(', ')
        });
    }
    return value;
};
exports.passwordValidator = passwordValidator;
// 강화된 비밀번호 스키마
exports.passwordSchema = joi_1.default.string()
    .min(8)
    .max(128)
    .custom(exports.passwordValidator)
    .messages({
    'string.min': '비밀번호는 최소 8자 이상이어야 합니다',
    'string.max': '비밀번호는 최대 128자까지 가능합니다',
    'password.invalid': '{#message}'
});
// 비밀번호 변경을 위한 스키마
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required().messages({
        'string.empty': '현재 비밀번호를 입력해주세요',
        'any.required': '현재 비밀번호를 입력해주세요'
    }),
    newPassword: exports.passwordSchema.required().messages({
        'any.required': '새 비밀번호를 입력해주세요'
    })
});
//# sourceMappingURL=passwordValidator.js.map