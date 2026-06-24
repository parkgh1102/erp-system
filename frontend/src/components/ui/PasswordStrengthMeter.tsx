import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password: string;
  /** 표시할 기준 목록을 직접 제어하고 싶을 때 사용 (기본: 길이/소문자/대문자/숫자/특수문자) */
  showCriteria?: boolean;
}

interface Criterion {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

const CRITERIA: Criterion[] = [
  { key: 'length', label: '8-20자 길이', test: (pw) => pw.length >= 8 && pw.length <= 20 },
  { key: 'lowercase', label: '소문자 포함', test: (pw) => /[a-z]/.test(pw) },
  { key: 'uppercase', label: '대문자 포함', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'number', label: '숫자 포함', test: (pw) => /\d/.test(pw) },
  { key: 'special', label: '특수문자 포함', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

const LEVELS = [
  { label: '매우 약함', color: '#ff4d4f' },
  { label: '약함', color: '#ff7a45' },
  { label: '보통', color: '#faad14' },
  { label: '강함', color: '#73d13d' },
  { label: '매우 강함', color: '#52c41a' },
];

/**
 * 입력 중 실시간으로 강도를 시각화하는 비밀번호 강도 표시기.
 * Framer Motion 으로 막대/문구가 부드럽게 전환된다.
 */
export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showCriteria = true,
}) => {
  const results = useMemo(
    () => CRITERIA.map((c) => ({ ...c, passed: c.test(password) })),
    [password]
  );
  const score = results.filter((r) => r.passed).length; // 0~5
  const level = score === 0 ? null : LEVELS[score - 1];
  const percent = (score / CRITERIA.length) * 100;

  return (
    <AnimatePresence>
      {password.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#666' }}>비밀번호 강도</span>
            <motion.span
              key={level?.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, fontWeight: 700, color: level?.color || '#999' }}
            >
              {level?.label || '-'}
            </motion.span>
          </div>

          {/* 강도 막대 */}
          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: '#f0f0f0',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ width: `${percent}%`, backgroundColor: level?.color || '#f0f0f0' }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              style={{ height: '100%', borderRadius: 6 }}
            />
          </div>

          {showCriteria && (
            <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
              {results.map((r) => (
                <motion.div
                  key={r.key}
                  animate={{ color: r.passed ? '#52c41a' : '#bbb' }}
                  style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <motion.span
                    animate={{ scale: r.passed ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'inline-block', width: 14 }}
                  >
                    {r.passed ? '✓' : '○'}
                  </motion.span>
                  {r.label}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PasswordStrengthMeter;
