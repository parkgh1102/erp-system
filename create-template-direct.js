const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('=== 거래처 템플릿 직접 생성 ===\n');

// 템플릿 데이터 - 정확한 순서로
const templateData = [
  {
    '거래처코드': 'C001',
    '거래처명': '예시거래처',
    '사업자번호': '123-45-67890',
    '주소': '서울시 강남구',
    '업태': '도소매',
    '종목': '사무용품',
    '대표자': '홍길동',
    '전화번호': '02-1234-5678',
    '팩스번호': '02-1234-5679',
    '이메일': 'example@email.com',
    '담당자 연락처': '010-1234-5678',
    '거래처구분': '매출처',
    '활성여부': 'Y'
  }
];

// 워크북 생성
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(templateData);

// 컬럼 너비 설정
ws['!cols'] = [
  { wch: 15 },  // 거래처코드
  { wch: 25 },  // 거래처명
  { wch: 15 },  // 사업자번호
  { wch: 30 },  // 주소
  { wch: 12 },  // 업태
  { wch: 12 },  // 종목
  { wch: 15 },  // 대표자
  { wch: 15 },  // 전화번호
  { wch: 15 },  // 팩스번호
  { wch: 25 },  // 이메일
  { wch: 15 },  // 담당자 연락처
  { wch: 12 },  // 거래처구분
  { wch: 10 }   // 활성여부
];

XLSX.utils.book_append_sheet(wb, ws, '거래처');

// 여러 경로에 저장
const paths = [
  'C:\\Users\\black\\Desktop\\거래처_업로드_템플릿_NEW.xlsx',
  path.join(__dirname, '거래처_업로드_템플릿_NEW.xlsx'),
  path.join(__dirname, 'backend', '거래처_업로드_템플릿_NEW.xlsx')
];

paths.forEach(filePath => {
  try {
    XLSX.writeFile(wb, filePath);
    console.log(`✅ 생성: ${filePath}`);

    // 검증
    const testWb = XLSX.readFile(filePath);
    const testWs = testWb.Sheets['거래처'];
    const testData = XLSX.utils.sheet_to_json(testWs);
    const columns = Object.keys(testData[0]);
    console.log(`   - 컬럼 수: ${columns.length}개`);
  } catch (err) {
    console.log(`❌ 실패: ${filePath} - ${err.message}`);
  }
});

console.log('\n=== 생성된 템플릿 컬럼 ===');
const columns = Object.keys(templateData[0]);
columns.forEach((col, idx) => {
  console.log(`${idx + 1}. ${col}`);
});

console.log('\n완료!');
