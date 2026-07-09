/**
 * 세션 길이 유틸.
 * 로그인 시 서버 응답(security.sessionTimeout)을 localStorage 'sessionTimeout'에 저장하며,
 * 이 값은 백엔드가 access token에 부여하는 만료시간과 동일 기준이다.
 * 프론트의 모든 세션 만료 타이머(ProtectedRoute, TokenExpirationNotifier)는 이 함수를 단일 소스로 사용한다.
 */
const TIMEOUT_MS: Record<string, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '8h': 8 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};
const DEFAULT_MS = 8 * 60 * 60 * 1000;

/** 세션 길이(밀리초). 저장값이 없거나 알 수 없으면 기본 8시간. */
export function getSessionTimeoutMs(): number {
  const key = localStorage.getItem('sessionTimeout') || '8h';
  return TIMEOUT_MS[key] || DEFAULT_MS;
}

/** 사람이 읽는 세션 길이 라벨 (예: "8시간"). */
export function getSessionTimeoutLabel(): string {
  const key = localStorage.getItem('sessionTimeout') || '8h';
  const hours = parseInt(key.replace('h', ''), 10);
  return isNaN(hours) ? '세션' : `${hours}시간`;
}
