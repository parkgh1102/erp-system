const XLSX = require('xlsx');

const filePath = 'C:/Users/black/Desktop/신erp1030-1/거래처_템플릿_테스트.xlsx';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('=== API에서 다운로드한 템플릿 검증 ===\n');

if (data.length > 0) {
  const columns = Object.keys(data[0]);
  console.log('총 컬럼 수:', columns.length);
  console.log('\n컬럼 목록:');
  columns.forEach((col, idx) => {
    console.log(`${idx + 1}. ${col}`);
  });

  console.log('\n샘플 데이터:');
  console.log(data[0]);
} else {
  console.log('데이터가 없습니다.');
}
