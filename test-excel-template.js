const XLSX = require('xlsx');
const fs = require('fs');

console.log('=== 거래처 템플릿 구조 테스트 ===\n');

// 예상되는 컬럼 순서 (관리 페이지와 동일)
const expectedColumns = [
  '거래처코드',
  '거래처명',
  '사업자번호',
  '주소',
  '업태',
  '종목',
  '대표자',
  '전화번호',
  '팩스번호',
  '이메일',
  '담당자 연락처',
  '거래처구분',
  '활성여부'
];

// 템플릿 데이터
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
  { wch: 20 },  // 거래처명
  { wch: 15 },  // 사업자번호
  { wch: 30 },  // 주소
  { wch: 15 },  // 업태
  { wch: 15 },  // 종목
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
const fileName = 'backend/거래처_업로드_템플릿_테스트.xlsx';
XLSX.writeFile(wb, fileName);

console.log(`✅ 템플릿 파일 생성 완료: ${fileName}\n`);

// 생성된 파일을 읽어서 컬럼 검증
const testWb = XLSX.readFile(fileName);
const testWs = testWb.Sheets['거래처'];
const testData = XLSX.utils.sheet_to_json(testWs);

console.log('📋 생성된 템플릿의 컬럼 순서:');
if (testData.length > 0) {
  const actualColumns = Object.keys(testData[0]);
  actualColumns.forEach((col, idx) => {
    const expected = expectedColumns[idx];
    const match = col === expected ? '✅' : '❌';
    console.log(`${idx + 1}. ${match} ${col}${col !== expected ? ` (예상: ${expected})` : ''}`);
  });

  console.log('\n📊 샘플 데이터:');
  console.log(testData[0]);

  // 기존 템플릿 파일과 비교 (있다면)
  const oldTemplatePath = 'C:\\Users\\black\\Desktop\\거래처_업로드_템플릿.xlsx';
  if (fs.existsSync(oldTemplatePath)) {
    console.log('\n🔍 기존 템플릿 파일과 비교:');
    try {
      const oldWb = XLSX.readFile(oldTemplatePath);
      const oldWs = oldWb.Sheets[oldWb.SheetNames[0]];
      const oldData = XLSX.utils.sheet_to_json(oldWs);

      if (oldData.length > 0) {
        const oldColumns = Object.keys(oldData[0]);
        console.log('\n기존 템플릿 컬럼:');
        oldColumns.forEach((col, idx) => {
          console.log(`${idx + 1}. ${col}`);
        });

        console.log('\n차이점:');
        const newCols = new Set(actualColumns);
        const oldCols = new Set(oldColumns);

        const added = actualColumns.filter(c => !oldCols.has(c));
        const removed = oldColumns.filter(c => !newCols.has(c));

        if (added.length > 0) {
          console.log('✅ 추가된 컬럼:', added.join(', '));
        }
        if (removed.length > 0) {
          console.log('❌ 제거된 컬럼:', removed.join(', '));
        }
        if (added.length === 0 && removed.length === 0 && actualColumns.length === oldColumns.length) {
          // 순서 비교
          let orderChanged = false;
          for (let i = 0; i < actualColumns.length; i++) {
            if (actualColumns[i] !== oldColumns[i]) {
              orderChanged = true;
              break;
            }
          }
          if (orderChanged) {
            console.log('📝 컬럼 순서가 변경되었습니다.');
          } else {
            console.log('✅ 컬럼이 동일합니다.');
          }
        }
      }
    } catch (err) {
      console.log('⚠️ 기존 템플릿 파일을 읽을 수 없습니다:', err.message);
    }
  }
} else {
  console.log('❌ 템플릿 데이터가 비어있습니다.');
}

console.log('\n=== 테스트 완료 ===');
