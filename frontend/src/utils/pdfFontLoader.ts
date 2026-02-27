/**
 * PDF 한글 폰트 로더
 * jsPDF에서 한글을 지원하기 위한 폰트 로딩 유틸리티
 */

import jsPDF from 'jspdf';

let fontLoaded = false;
let fontLoadPromise: Promise<string> | null = null;
let cachedFontBase64: string | null = null;

// 폰트 경로 목록 (순서대로 시도)
const FONT_URLS = [
  '/fonts/NanumGothic.ttf',
  './fonts/NanumGothic.ttf',
  'https://hangeul.naver.com/hangeul_static/webfont/NanumGothic/NanumGothic.ttf',
  'https://cdn.jsdelivr.net/gh/niceplugin/vite-plugin-webfont-dl/demo/public/fonts/NanumGothic-Regular.ttf',
];

/**
 * 폰트 파일을 Base64로 변환
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

/**
 * 여러 URL에서 폰트 로드 시도
 */
const fetchFontFromUrls = async (urls: string[]): Promise<ArrayBuffer> => {
  for (const url of urls) {
    try {
      console.log(`폰트 로드 시도: ${url}`);
      const response = await fetch(url, {
        mode: url.startsWith('http') ? 'cors' : 'same-origin',
        cache: 'force-cache'
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        // TTF 파일인지 확인 (HTML 에러 페이지가 아닌지)
        if (contentType && contentType.includes('text/html')) {
          console.warn(`${url}에서 HTML 응답 받음, 다음 URL 시도`);
          continue;
        }
        const buffer = await response.arrayBuffer();
        // 최소 크기 확인 (유효한 폰트 파일인지)
        if (buffer.byteLength < 10000) {
          console.warn(`${url}에서 받은 파일이 너무 작음 (${buffer.byteLength} bytes), 다음 URL 시도`);
          continue;
        }
        console.log(`폰트 로드 성공: ${url} (${buffer.byteLength} bytes)`);
        return buffer;
      }
    } catch (error) {
      console.warn(`${url}에서 폰트 로드 실패:`, error);
    }
  }
  throw new Error('모든 폰트 URL에서 로드 실패');
};

/**
 * 나눔고딕 폰트를 jsPDF에 로드
 */
export const loadKoreanFont = async (doc: jsPDF): Promise<void> => {
  // 이미 로드된 폰트가 있으면 바로 적용
  if (fontLoaded && cachedFontBase64) {
    try {
      doc.addFileToVFS('NanumGothic.ttf', cachedFontBase64);
      doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
      doc.addFont('NanumGothic.ttf', 'NanumGothic', 'bold');
      doc.setFont('NanumGothic', 'normal');
      return;
    } catch (e) {
      // VFS에 이미 있을 수 있음, 폰트만 설정
      try {
        doc.setFont('NanumGothic', 'normal');
        return;
      } catch (e2) {
        // 폰트가 없음, 다시 로드 필요
        fontLoaded = false;
        cachedFontBase64 = null;
        fontLoadPromise = null;
      }
    }
  }

  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      try {
        const arrayBuffer = await fetchFontFromUrls(FONT_URLS);
        const base64 = arrayBufferToBase64(arrayBuffer);
        cachedFontBase64 = base64;
        fontLoaded = true;
        return base64;
      } catch (error) {
        console.error('폰트 로딩 실패:', error);
        fontLoadPromise = null;
        throw error;
      }
    })();
  }

  const base64 = await fontLoadPromise;

  // 현재 문서에 폰트 추가 (normal, bold 모두 동일 폰트 파일로 등록 - 가짜 bold 렌더링 방지)
  try {
    doc.addFileToVFS('NanumGothic.ttf', base64);
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'bold');
    doc.setFont('NanumGothic', 'normal');
  } catch (error) {
    console.error('폰트 적용 실패:', error);
    throw error;
  }
};

/**
 * 새로운 jsPDF 인스턴스 생성 (한글 폰트 포함)
 */
export const createPDFWithKoreanFont = async (
  orientation: 'p' | 'l' = 'p',
  unit: 'mm' | 'pt' | 'px' = 'mm',
  format: string | number[] = 'a4'
): Promise<jsPDF> => {
  const doc = new jsPDF(orientation, unit, format);
  await loadKoreanFont(doc);
  return doc;
};
