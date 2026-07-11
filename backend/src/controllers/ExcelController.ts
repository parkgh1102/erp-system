import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer, CustomerType } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { SalesItem } from '../entities/SalesItem';
import { Purchase } from '../entities/Purchase';
import { PurchaseItem } from '../entities/PurchaseItem';
import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────
// exceljs 헬퍼 (xlsx 대체)
// - xlsx는 npm 레지스트리에 보안 패치가 없어(prototype pollution/ReDoS) exceljs로 이관.
// - 아래 두 헬퍼로 기존 XLSX.utils.json_to_sheet / sheet_to_json 동작을 동일하게 재현.
// ─────────────────────────────────────────────────────────────

/** 헤더 1행 + 샘플 1행짜리 템플릿 워크북 버퍼 생성 (기존 json_to_sheet 대체) */
async function buildTemplateBuffer(
  sheetName: string,
  headers: string[],
  widths: number[],
  sampleRow: Record<string, unknown>
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = headers.map((h, i) => ({ header: h, key: h, width: widths[i] }));
  ws.addRow(sampleRow);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** exceljs 셀 값을 원시 값으로 정규화 (Date는 유지, 리치텍스트/수식/하이퍼링크 평탄화) */
function normalizeCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    const v = value as unknown as Record<string, unknown>;
    if ('richText' in v && Array.isArray(v.richText)) {
      return (v.richText as Array<{ text?: string }>).map(t => t.text ?? '').join('');
    }
    if ('text' in v) return v.text; // 하이퍼링크
    if ('result' in v) return v.result; // 수식 결과
    if ('error' in v) return null;
    return String(value);
  }
  return value; // string | number | boolean
}

/**
 * 업로드된 xlsx 버퍼의 첫 시트를 객체 배열로 파싱 (기존 XLSX.utils.sheet_to_json 대체).
 * 1행을 헤더로 사용하고, 업로드 파일의 실제 헤더명을 키로 그대로 사용한다(기존 동작 보존).
 * 완전히 빈 행은 건너뛴다.
 */
async function readSheetToJson(buffer: Buffer): Promise<Record<string, unknown>[]> {
  const wb = new ExcelJS.Workbook();
  // @types/node의 제네릭 Buffer<ArrayBufferLike>와 exceljs의 Buffer 타입 마찰 회피
  await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // 헤더(1행) 수집 — 열 인덱스(1-based) 기준 sparse 배열
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const text = normalizeCellValue(cell.value);
    if (text !== null && text !== undefined && String(text).trim() !== '') {
      headers[col] = String(text).trim();
    }
  });

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    for (let c = 1; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const v = normalizeCellValue(row.getCell(c).value);
      if (v !== null && v !== undefined && v !== '') {
        obj[key] = v;
        hasValue = true;
      }
    }
    if (hasValue) rows.push(obj);
  }
  return rows;
}

// Excel 템플릿 생성
export const generateCustomerTemplate = async (req: Request, res: Response) => {
  try {
    // 거래처 템플릿 데이터
    const sampleRow = {
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
    };
    const widths = [15, 25, 15, 30, 12, 12, 15, 15, 15, 25, 15, 12, 10];

    const buffer = await buildTemplateBuffer('거래처', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=customer_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('거래처 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

export const generateProductTemplate = async (req: Request, res: Response) => {
  try {
    // 품목 템플릿 데이터
    const sampleRow = {
      '품목코드': 'P001',
      '품목명': '예시품목',
      '규격': 'A4',
      '단위': 'EA',
      '매입단가': '10000',
      '매출단가': '15000',
      '분류': '사무용품',
      '세금구분': 'tax_separate',
      '비고': '',
      '활성여부': 'Y'
    };
    const widths = [15, 25, 15, 10, 12, 12, 15, 15, 25, 10];

    const buffer = await buildTemplateBuffer('품목', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('품목 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

export const generateSalesTemplate = async (req: Request, res: Response) => {
  try {
    // 매출 템플릿 데이터 - 새로운 순서
    const sampleRow = {
      '매출일자': '2025-01-01',
      '거래처명': '예시거래처',
      '품목명': '예시품목',
      '규격': 'A4',
      '수량': '10',
      '단위': 'EA',
      '단가': '15000',
      '공급가액': '150000',
      '세액': '15000',
      '비고': ''
    };
    const widths = [12, 20, 25, 15, 10, 10, 12, 15, 12, 25];

    const buffer = await buildTemplateBuffer('매출', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=sales_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('매출 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

export const generatePurchaseTemplate = async (req: Request, res: Response) => {
  try {
    // 매입 템플릿 데이터 - 새로운 순서
    const sampleRow = {
      '매입일자': '2025-01-01',
      '거래처명': '예시거래처',
      '품목명': '예시품목',
      '규격': 'A4',
      '수량': '10',
      '단위': 'EA',
      '단가': '10000',
      '공급가액': '100000',
      '세액': '10000',
      '비고': ''
    };
    const widths = [12, 20, 25, 15, 10, 10, 12, 15, 12, 25];

    const buffer = await buildTemplateBuffer('매입', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=purchase_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('매입 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

// 수금 템플릿 생성
export const generateReceivableTemplate = async (req: Request, res: Response) => {
  try {
    // 수금 템플릿 데이터
    const sampleRow = {
      'No.': '1',
      '수금일자': '2025-01-01',
      '거래처': '예시거래처',
      '수금금액': '1000000',
      '메모': ''
    };
    const widths = [8, 12, 20, 15, 25];

    const buffer = await buildTemplateBuffer('수금', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=receivable_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('수금 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

// 지급 템플릿 생성
export const generatePayableTemplate = async (req: Request, res: Response) => {
  try {
    // 지급 템플릿 데이터
    const sampleRow = {
      'No.': '1',
      '지급일자': '2025-01-01',
      '거래처': '예시거래처',
      '지급금액': '1000000',
      '메모': ''
    };
    const widths = [8, 12, 20, 15, 25];

    const buffer = await buildTemplateBuffer('지급', Object.keys(sampleRow), widths, sampleRow);

    res.setHeader('Content-Disposition', 'attachment; filename=payable_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('지급 템플릿 생성 오류:', error);
    res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
  }
};

// Excel 업로드 처리
export const uploadCustomers = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const businessId = parseInt(req.params.businessId);
    const data = await readSheetToJson(req.file.buffer);

    const customerRepo = AppDataSource.getRepository(Customer);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of data as any[]) {
      try {
        // 거래처구분 매핑
        let customerType = CustomerType.OTHER;
        if (row['거래처구분'] === '매출처') customerType = CustomerType.SALES;
        else if (row['거래처구분'] === '매입처') customerType = CustomerType.PURCHASE;

        // 거래처 코드 - 엑셀에 입력된 값 그대로 사용
        const customerCode = String(row['거래처코드'] || '').trim();

        // 담당자 연락처 - 여러 가지 컬럼명 시도
        const managerContact = row['담당자 연락처'] || row['담당자연락처'] || row['담당자 휴대폰'] || row['담당자휴대폰'] || row['휴대폰'] || row['핸드폰'] || null;

        // 기존 거래처 코드가 있는지 확인
        let customer = await customerRepo.findOne({
          where: { businessId, customerCode }
        });

        if (customer) {
          // 기존 거래처 업데이트
          customer.name = row['거래처명'];
          customer.businessNumber = row['사업자번호'] || null;
          customer.address = row['주소'] || null;
          customer.businessType = row['업태'] || null;
          customer.businessItem = row['종목'] || null;
          customer.representative = row['대표자'] || null;
          customer.phone = row['전화번호'] || null;
          customer.fax = row['팩스번호'] || null;
          customer.email = row['이메일'] || null;
          customer.managerContact = managerContact;
          customer.customerType = customerType;
          customer.isActive = row['활성여부'] === 'Y';
        } else {
          // 새 거래처 생성
          customer = customerRepo.create({
            businessId,
            customerCode,
            name: row['거래처명'],
            businessNumber: row['사업자번호'] || null,
            address: row['주소'] || null,
            businessType: row['업태'] || null,
            businessItem: row['종목'] || null,
            representative: row['대표자'] || null,
            phone: row['전화번호'] || null,
            fax: row['팩스번호'] || null,
            email: row['이메일'] || null,
            managerContact: managerContact,
            customerType,
            isActive: row['활성여부'] === 'Y'
          });
        }

        await customerRepo.save(customer);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${row['거래처코드']}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('거래처 업로드 오류:', error);
    res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
  }
};

export const uploadProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const businessId = parseInt(req.params.businessId);
    const data = await readSheetToJson(req.file.buffer);

    const productRepo = AppDataSource.getRepository(Product);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const row of data as any[]) {
      try {
        // 세금구분 매핑 (한글 -> 영문 코드) - 기본값은 과세별도(tax_separate)
        let taxType = 'tax_separate';
        const rawTaxType = (row['세금구분'] || '').toString().trim();
        // 공백 제거한 버전도 준비
        const taxTypeNormalized = rawTaxType.replace(/\s/g, '').toLowerCase();

        // 면세 체크 (먼저 체크)
        if (taxTypeNormalized === 'tax_free' ||
            taxTypeNormalized === '면세' ||
            taxTypeNormalized.includes('면세')) {
          taxType = 'tax_free';
        }
        // 과세포함 체크 (포함 키워드가 있는 경우, 단 별도는 제외)
        else if (taxTypeNormalized === 'tax_inclusive' ||
                 taxTypeNormalized === '과세10%포함' ||
                 taxTypeNormalized === '과세포함' ||
                 taxTypeNormalized === '과세(포함)' ||
                 (taxTypeNormalized.includes('포함') && !taxTypeNormalized.includes('별도'))) {
          taxType = 'tax_inclusive';
        }
        // 과세별도 (기본값) - 명시적 체크도 추가
        // tax_separate, 과세10%별도, 과세별도, 별도 등은 모두 기본값(tax_separate)으로 처리됨

        // 품목 코드
        const productCode = String(row['품목코드'] || '').trim();

        // 기존 품목 코드가 있는지 확인
        let product = await productRepo.findOne({
          where: { businessId, productCode }
        });

        if (product) {
          // 기존 품목 업데이트
          product.name = row['품목명'];
          product.spec = row['규격'] || null;
          product.unit = row['단위'] || null;
          product.buyPrice = parseFloat(row['매입단가']) || 0;
          product.sellPrice = parseFloat(row['매출단가']) || 0;
          product.category = row['분류'] || null;
          product.taxType = taxType;
          product.memo = row['비고'] || null;
          product.isActive = row['활성여부'] === 'Y';
        } else {
          // 새 품목 생성
          product = productRepo.create({
            businessId,
            productCode,
            name: row['품목명'],
            spec: row['규격'] || null,
            unit: row['단위'] || null,
            currentStock: 0, // 엑셀 업로드 시 재고는 0으로 초기화
            buyPrice: parseFloat(row['매입단가']) || 0,
            sellPrice: parseFloat(row['매출단가']) || 0,
            category: row['분류'] || null,
            taxType: taxType,
            memo: row['비고'] || null,
            isActive: row['활성여부'] === 'Y'
          });
        }

        await productRepo.save(product);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${row['품목코드']}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('품목 업로드 오류:', error);
    res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
  }
};

export const uploadSales = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const businessId = parseInt(req.params.businessId);
    const data = await readSheetToJson(req.file.buffer);

    const salesRepo = AppDataSource.getRepository(Sales);
    const salesItemRepo = AppDataSource.getRepository(SalesItem);
    const customerRepo = AppDataSource.getRepository(Customer);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // 거래일자별로 그룹화
    const groupedData: { [key: string]: any[] } = {};
    for (const row of data as any[]) {
      const key = `${row['거래일자']}_${row['거래처코드']}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(row);
    }

    // 각 그룹별로 Sales 생성
    for (const key in groupedData) {
      try {
        const rows = groupedData[key];
        // 배열 범위 체크 - 빈 배열 방지
        if (!rows || rows.length === 0) {
          console.warn(`그룹 ${key}의 데이터가 비어있습니다.`);
          continue;
        }
        const firstRow = rows[0];

        // 거래처 찾기
        const customer = await customerRepo.findOne({
          where: { businessId, customerCode: firstRow['거래처코드'] }
        });

        // 매출 생성
        const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r['공급가액']), 0);
        const vatAmount = rows.reduce((sum, r) => sum + parseFloat(r['세액']), 0);

        const sales = salesRepo.create({
          businessId,
          customerId: customer?.id,
          transactionDate: new Date(firstRow['거래일자']),
          totalAmount,
          vatAmount
        });

        const savedSales = await salesRepo.save(sales);

        // 매출 항목 생성
        for (const row of rows) {
          const salesItem = salesItemRepo.create({
            salesId: savedSales.id,
            itemName: row['품목명'],
            specification: row['규격'] || null,
            quantity: parseFloat(row['수량']),
            unit: row['단위'] || null,
            unitPrice: parseFloat(row['단가']),
            supplyAmount: parseFloat(row['공급가액']),
            taxAmount: parseFloat(row['세액']),
            remark: row['비고'] || null
          });

          await salesItemRepo.save(salesItem);
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${key}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('매출 업로드 오류:', error);
    res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
  }
};

export const uploadPurchases = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
    }

    const businessId = parseInt(req.params.businessId);
    const data = await readSheetToJson(req.file.buffer);

    const purchaseRepo = AppDataSource.getRepository(Purchase);
    const purchaseItemRepo = AppDataSource.getRepository(PurchaseItem);
    const customerRepo = AppDataSource.getRepository(Customer);
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // 매입일자별로 그룹화
    const groupedData: { [key: string]: any[] } = {};
    for (const row of data as any[]) {
      const key = `${row['매입일자']}_${row['거래처코드']}`;
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(row);
    }

    // 각 그룹별로 Purchase 생성
    for (const key in groupedData) {
      try {
        const rows = groupedData[key];
        // 배열 범위 체크 - 빈 배열 방지
        if (!rows || rows.length === 0) {
          console.warn(`그룹 ${key}의 데이터가 비어있습니다.`);
          continue;
        }
        const firstRow = rows[0];

        // 거래처 찾기
        const customer = await customerRepo.findOne({
          where: { businessId, customerCode: firstRow['거래처코드'] }
        });

        // 매입 생성
        const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r['금액'] || 0), 0);
        const vatAmount = totalAmount * 0.1; // 10% 부가세

        const purchase = purchaseRepo.create({
          businessId,
          customerId: customer?.id,
          purchaseDate: new Date(firstRow['매입일자']),
          totalAmount,
          vatAmount
        });

        const savedPurchase = await purchaseRepo.save(purchase);

        // 매입 항목 생성
        for (const row of rows) {
          const purchaseItem = purchaseItemRepo.create({
            purchaseId: savedPurchase.id,
            productCode: row['품목코드'] || null,
            productName: row['품목명'],
            spec: row['규격'] || null,
            unit: row['단위'] || null,
            quantity: parseFloat(row['수량']),
            unitPrice: parseFloat(row['단가']),
            amount: parseFloat(row['금액'])
          });

          await purchaseItemRepo.save(purchaseItem);
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${key}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('매입 업로드 오류:', error);
    res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
  }
};
