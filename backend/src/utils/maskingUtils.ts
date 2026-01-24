/**
 * 민감 정보 마스킹 유틸리티
 *
 * 로그에 기록할 때 개인정보를 보호하기 위한 마스킹 함수들
 */

/**
 * 이메일 마스킹
 * example@domain.com -> exa***@domain.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return '***';
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return localPart.charAt(0) + '***@' + domain;
  }
  return localPart.substring(0, 3) + '***@' + domain;
}

/**
 * 전화번호 마스킹
 * 010-1234-5678 -> 010-****-5678
 */
export function maskPhone(phone: string): string {
  if (!phone) {
    return '***';
  }

  // 숫자만 추출
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 7) {
    return '***';
  }

  // 앞 3자리와 뒤 4자리만 표시
  return digits.substring(0, 3) + '****' + digits.substring(digits.length - 4);
}

/**
 * 사업자등록번호 마스킹
 * 123-45-67890 -> 123-**-*****
 */
export function maskBusinessNumber(businessNumber: string): string {
  if (!businessNumber) {
    return '***';
  }

  // 숫자만 추출
  const digits = businessNumber.replace(/[^0-9]/g, '');
  if (digits.length < 10) {
    return '***';
  }

  // 앞 3자리만 표시
  return digits.substring(0, 3) + '-**-*****';
}

/**
 * 이름 마스킹
 * 홍길동 -> 홍*동
 */
export function maskName(name: string): string {
  if (!name) {
    return '***';
  }

  if (name.length === 1) {
    return '*';
  } else if (name.length === 2) {
    return name.charAt(0) + '*';
  } else {
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
  }
}

/**
 * IP 주소 마스킹
 * 192.168.1.100 -> 192.168.*.*
 */
export function maskIP(ip: string): string {
  if (!ip) {
    return '***';
  }

  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts[0] + '.' + parts[1] + '.*.*';
  }

  // IPv6 또는 기타 형식
  return ip.substring(0, Math.min(8, ip.length)) + '***';
}

/**
 * 객체 내 민감 정보 마스킹
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();

    if (lowerKey.includes('email')) {
      masked[key] = maskEmail(String(masked[key] || ''));
    } else if (lowerKey.includes('phone') || lowerKey.includes('tel')) {
      masked[key] = maskPhone(String(masked[key] || ''));
    } else if (lowerKey.includes('businessnumber') || lowerKey.includes('business_number')) {
      masked[key] = maskBusinessNumber(String(masked[key] || ''));
    } else if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      masked[key] = '[REDACTED]';
    } else if (lowerKey === 'name') {
      masked[key] = maskName(String(masked[key] || ''));
    } else if (lowerKey === 'ip' || lowerKey.includes('ipaddress')) {
      masked[key] = maskIP(String(masked[key] || ''));
    }
  }

  return masked;
}
