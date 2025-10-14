export interface PasswordStrength {
  score: number; // 0-4 (약함-강함)
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    noCommon: boolean;
  };
}

// 흔한 비밀번호 패턴
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  '111111', '123123', 'admin', 'letmein', 'welcome', 'monkey',
  '1234567890', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'
];

// 연속된 문자 체크 (4개 이상 연속일 때만)
const hasSequentialChars = (password: string): boolean => {
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
const hasRepeatingChars = (password: string): boolean => {
  const repeats = /(.)\1{2,}/; // 같은 문자 3번 이상 반복
  return repeats.test(password);
};

// 키보드 패턴 체크
const hasKeyboardPattern = (password: string): boolean => {
  const patterns = [
    'qwer', 'asdf', 'zxcv', '1234', '4567', '7890',
    'qwerty', 'asdfgh', 'zxcvbn'
  ];

  const lower = password.toLowerCase();
  return patterns.some(pattern => lower.includes(pattern));
};

export const validatePassword = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommon: !COMMON_PASSWORDS.some(common =>
      password.toLowerCase().includes(common.toLowerCase())
    )
  };

  const feedback: string[] = [];
  let score = 0;

  // 길이 체크
  if (!requirements.length) {
    feedback.push('최소 8자 이상이어야 합니다');
  } else {
    score += 1;
    if (password.length >= 12) score += 1; // 12자 이상 보너스
  }

  // 문자 종류 체크
  if (!requirements.uppercase) {
    feedback.push('대문자를 포함해야 합니다');
  } else {
    score += 1;
  }

  if (!requirements.lowercase) {
    feedback.push('소문자를 포함해야 합니다');
  } else {
    score += 1;
  }

  if (!requirements.number) {
    feedback.push('숫자를 포함해야 합니다');
  } else {
    score += 1;
  }

  if (!requirements.special) {
    feedback.push('특수문자(!@#$%^&* 등)를 포함해야 합니다');
  } else {
    score += 1;
  }

  // 고급 보안 체크
  if (!requirements.noCommon) {
    feedback.push('흔한 비밀번호 패턴을 피해주세요');
    score -= 1;
  }

  if (hasSequentialChars(password)) {
    feedback.push('4자 이상 연속된 문자(abcd, 1234 등)를 피해주세요');
    score -= 1;
  }

  if (hasRepeatingChars(password)) {
    feedback.push('같은 문자를 연속으로 3번 이상 사용하지 마세요');
    score -= 1;
  }

  if (hasKeyboardPattern(password)) {
    feedback.push('키보드 패턴(qwer, asdf 등)을 피해주세요');
    score -= 1;
  }

  // 점수 보정
  score = Math.max(0, Math.min(4, score));

  // 피드백 메시지
  if (feedback.length === 0) {
    if (score === 4) {
      feedback.push('매우 강한 비밀번호입니다!');
    } else if (score === 3) {
      feedback.push('강한 비밀번호입니다');
    } else {
      feedback.push('양호한 비밀번호입니다');
    }
  }

  // 기본 요구사항 충족 여부
  const isValid = requirements.length &&
                 requirements.uppercase &&
                 requirements.lowercase &&
                 requirements.number &&
                 requirements.special &&
                 requirements.noCommon;

  return {
    score,
    feedback,
    isValid,
    requirements
  };
};

// 비밀번호 강도 레벨 문자열
export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return '매우 약함';
    case 2:
      return '약함';
    case 3:
      return '보통';
    case 4:
      return '강함';
    default:
      return '매우 약함';
  }
};

// 비밀번호 강도 색상
export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return '#ff4d4f'; // 빨간색
    case 2:
      return '#faad14'; // 주황색
    case 3:
      return '#52c41a'; // 초록색
    case 4:
      return '#1890ff'; // 파란색
    default:
      return '#ff4d4f';
  }
};