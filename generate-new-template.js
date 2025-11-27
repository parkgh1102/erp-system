const XLSX = require('xlsx');

console.log('=== 새로운 거래처 템플릿 생성 ===\n');

// 정확한 컬럼 순서로 템플릿 데이터 생성
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

// 파일 저장
const fileName = 'C:/Users/black/Desktop/거래처_업로드_템플릿.xlsx';
XLSX.writeFile(wb, fileName);

console.log(`✅ 새 템플릿 파일 생성 완료: ${fileName}\n`);

// 생성된 파일 검증
const testWb = XLSX.readFile(fileName);
const testWs = testWb.Sheets['거래처'];
const testData = XLSX.utils.sheet_to_json(testWs);

if (testData.length > 0) {
  const columns = Object.keys(testData[0]);
  console.log(`총 ${columns.length}개 컬럼 생성됨:\n`);
  columns.forEach((col, idx) => {
    console.log(`${idx + 1}. ${col}`);
  });

  console.log('\n샘플 데이터:');
  console.log(testData[0]);
}

console.log('\n=== 완료 ===');
console.log('이제 이 파일을 시스템에서 업로드하실 수 있습니다.');
