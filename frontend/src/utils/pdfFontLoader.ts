/**
 * PDF 한글 폰트 로더
 * jsPDF에서 한글을 지원하기 위한 폰트 로딩 유틸리티
 */

import jsPDF from 'jspdf';

let fontLoaded = false;
let fontLoadPromise: Promise<void> | null = null;

/**
 * 폰트 파일을 Base64로 변환
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * 나눔고딕 폰트를 jsPDF에 로드
 */
export const loadKoreanFont = async (doc: jsPDF): Promise<void> => {
  if (fontLoaded) {
    doc.setFont('NanumGothic', 'normal');
    return;
  }

  if (!fontLoadPromise) {
    fontLoadPromise = (async () => {
      try {
        // 폰트 파일 fetch
        const response = await fetch('/fonts/NanumGothic.ttf');
        if (!response.ok) {
          throw new Error('폰트 파일을 불러올 수 없습니다.');
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        // jsPDF VFS에 폰트 추가
        const callAddFont = function(this: jsPDF) {
          this.addFileToVFS('NanumGothic.ttf', base64);
          this.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
        };

        // jsPDF 이벤트에 폰트 등록
        jsPDF.API.events.push(['addFonts', callAddFont]);

        fontLoaded = true;
      } catch (error) {
        console.error('폰트 로딩 실패:', error);
        throw error;
      }
    })();
  }

  await fontLoadPromise;

  // 현재 문서에도 폰트 추가
  try {
    const response = await fetch('/fonts/NanumGothic.ttf');
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    doc.addFileToVFS('NanumGothic.ttf', base64);
    doc.addFont('NanumGothic.ttf', 'NanumGothic', 'normal');
    doc.setFont('NanumGothic', 'normal');
  } catch (error) {
    console.error('폰트 적용 실패:', error);
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
