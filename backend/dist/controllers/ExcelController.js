"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPurchases = exports.uploadSales = exports.uploadProducts = exports.uploadCustomers = exports.generatePayableTemplate = exports.generateReceivableTemplate = exports.generatePurchaseTemplate = exports.generateSalesTemplate = exports.generateProductTemplate = exports.generateCustomerTemplate = void 0;
const database_1 = require("../config/database");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Sales_1 = require("../entities/Sales");
const SalesItem_1 = require("../entities/SalesItem");
const Purchase_1 = require("../entities/Purchase");
const PurchaseItem_1 = require("../entities/PurchaseItem");
const XLSX = __importStar(require("xlsx"));
// Excel 템플릿 생성
const generateCustomerTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 거래처 템플릿 데이터
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
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 15 }, // 거래처코드
            { wch: 25 }, // 거래처명
            { wch: 15 }, // 사업자번호
            { wch: 30 }, // 주소
            { wch: 12 }, // 업태
            { wch: 12 }, // 종목
            { wch: 15 }, // 대표자
            { wch: 15 }, // 전화번호
            { wch: 15 }, // 팩스번호
            { wch: 25 }, // 이메일
            { wch: 15 }, // 담당자 연락처
            { wch: 12 }, // 거래처구분
            { wch: 10 } // 활성여부
        ];
        XLSX.utils.book_append_sheet(wb, ws, '거래처');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=customer_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('거래처 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generateCustomerTemplate = generateCustomerTemplate;
const generateProductTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 품목 템플릿 데이터
        const templateData = [
            {
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
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 15 }, // 품목코드
            { wch: 25 }, // 품목명
            { wch: 15 }, // 규격
            { wch: 10 }, // 단위
            { wch: 12 }, // 매입단가
            { wch: 12 }, // 매출단가
            { wch: 15 }, // 분류
            { wch: 15 }, // 세금구분
            { wch: 25 }, // 비고
            { wch: 10 } // 활성여부
        ];
        XLSX.utils.book_append_sheet(wb, ws, '품목');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('품목 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generateProductTemplate = generateProductTemplate;
const generateSalesTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 매출 템플릿 데이터 - 새로운 순서
        const templateData = [
            {
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
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 12 }, // 매출일자
            { wch: 20 }, // 거래처명
            { wch: 25 }, // 품목명
            { wch: 15 }, // 규격
            { wch: 10 }, // 수량
            { wch: 10 }, // 단위
            { wch: 12 }, // 단가
            { wch: 15 }, // 공급가액
            { wch: 12 }, // 세액
            { wch: 25 } // 비고
        ];
        XLSX.utils.book_append_sheet(wb, ws, '매출');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=sales_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('매출 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generateSalesTemplate = generateSalesTemplate;
const generatePurchaseTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 매입 템플릿 데이터 - 새로운 순서
        const templateData = [
            {
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
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 12 }, // 매입일자
            { wch: 20 }, // 거래처명
            { wch: 25 }, // 품목명
            { wch: 15 }, // 규격
            { wch: 10 }, // 수량
            { wch: 10 }, // 단위
            { wch: 12 }, // 단가
            { wch: 15 }, // 공급가액
            { wch: 12 }, // 세액
            { wch: 25 } // 비고
        ];
        XLSX.utils.book_append_sheet(wb, ws, '매입');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=purchase_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('매입 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generatePurchaseTemplate = generatePurchaseTemplate;
// 수금 템플릿 생성
const generateReceivableTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 수금 템플릿 데이터
        const templateData = [
            {
                'No.': '1',
                '수금일자': '2025-01-01',
                '거래처': '예시거래처',
                '수금금액': '1000000',
                '메모': ''
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 8 }, // No.
            { wch: 12 }, // 수금일자
            { wch: 20 }, // 거래처
            { wch: 15 }, // 수금금액
            { wch: 25 } // 메모
        ];
        XLSX.utils.book_append_sheet(wb, ws, '수금');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=receivable_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('수금 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generateReceivableTemplate = generateReceivableTemplate;
// 지급 템플릿 생성
const generatePayableTemplate = async (req, res) => {
    try {
        const wb = XLSX.utils.book_new();
        // 지급 템플릿 데이터
        const templateData = [
            {
                'No.': '1',
                '지급일자': '2025-01-01',
                '거래처': '예시거래처',
                '지급금액': '1000000',
                '메모': ''
            }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        // 컬럼 너비 설정
        ws['!cols'] = [
            { wch: 8 }, // No.
            { wch: 12 }, // 지급일자
            { wch: 20 }, // 거래처
            { wch: 15 }, // 지급금액
            { wch: 25 } // 메모
        ];
        XLSX.utils.book_append_sheet(wb, ws, '지급');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename=payable_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    }
    catch (error) {
        console.error('지급 템플릿 생성 오류:', error);
        res.status(500).json({ success: false, message: '템플릿 생성 중 오류가 발생했습니다.' });
    }
};
exports.generatePayableTemplate = generatePayableTemplate;
// Excel 업로드 처리
const uploadCustomers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }
        const businessId = parseInt(req.params.businessId);
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        const customerRepo = database_1.AppDataSource.getRepository(Customer_1.Customer);
        const results = { success: 0, failed: 0, errors: [] };
        for (const row of data) {
            try {
                // 디버깅: 컬럼명 확인
                console.log('업로드 row 키:', Object.keys(row));
                // 거래처구분 매핑
                let customerType = Customer_1.CustomerType.OTHER;
                if (row['거래처구분'] === '매출처')
                    customerType = Customer_1.CustomerType.SALES;
                else if (row['거래처구분'] === '매입처')
                    customerType = Customer_1.CustomerType.PURCHASE;
                // 거래처 코드 - 엑셀에 입력된 값 그대로 사용
                const customerCode = String(row['거래처코드'] || '').trim();
                // 담당자 연락처 - 여러 가지 컬럼명 시도
                const managerContact = row['담당자 연락처'] || row['담당자연락처'] || row['담당자 휴대폰'] || row['담당자휴대폰'] || row['휴대폰'] || row['핸드폰'] || null;
                console.log('담당자 연락처 값:', managerContact, '| row 담당자 연락처:', row['담당자 연락처']);
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
                }
                else {
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
            }
            catch (error) {
                results.failed++;
                results.errors.push(`${row['거래처코드']}: ${error.message}`);
            }
        }
        res.json({
            success: true,
            message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
            results
        });
    }
    catch (error) {
        console.error('거래처 업로드 오류:', error);
        res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
    }
};
exports.uploadCustomers = uploadCustomers;
const uploadProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }
        const businessId = parseInt(req.params.businessId);
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
        const results = { success: 0, failed: 0, errors: [] };
        for (const row of data) {
            try {
                // 세금구분 매핑 (한글 -> 영문 코드)
                let taxType = 'tax_separate'; // 기본값: 과세(별도)
                const rawTaxType = row['세금구분'] || '';
                if (rawTaxType === '면세' || rawTaxType === 'tax_free') {
                    taxType = 'tax_free';
                }
                else if (rawTaxType === '과세(포함)' || rawTaxType === '포함' || rawTaxType === 'tax_inclusive') {
                    taxType = 'tax_inclusive';
                }
                else if (rawTaxType === '과세(별도)' || rawTaxType === '별도' || rawTaxType === '과세' || rawTaxType === 'tax_separate') {
                    taxType = 'tax_separate';
                }
                const product = productRepo.create({
                    businessId,
                    productCode: row['품목코드'],
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
                await productRepo.save(product);
                results.success++;
            }
            catch (error) {
                results.failed++;
                results.errors.push(`${row['품목코드']}: ${error.message}`);
            }
        }
        res.json({
            success: true,
            message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
            results
        });
    }
    catch (error) {
        console.error('품목 업로드 오류:', error);
        res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
    }
};
exports.uploadProducts = uploadProducts;
const uploadSales = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }
        const businessId = parseInt(req.params.businessId);
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
        const salesItemRepo = database_1.AppDataSource.getRepository(SalesItem_1.SalesItem);
        const customerRepo = database_1.AppDataSource.getRepository(Customer_1.Customer);
        const results = { success: 0, failed: 0, errors: [] };
        // 거래일자별로 그룹화
        const groupedData = {};
        for (const row of data) {
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
            }
            catch (error) {
                results.failed++;
                results.errors.push(`${key}: ${error.message}`);
            }
        }
        res.json({
            success: true,
            message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
            results
        });
    }
    catch (error) {
        console.error('매출 업로드 오류:', error);
        res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
    }
};
exports.uploadSales = uploadSales;
const uploadPurchases = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '파일이 업로드되지 않았습니다.' });
        }
        const businessId = parseInt(req.params.businessId);
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        const purchaseRepo = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
        const purchaseItemRepo = database_1.AppDataSource.getRepository(PurchaseItem_1.PurchaseItem);
        const customerRepo = database_1.AppDataSource.getRepository(Customer_1.Customer);
        const results = { success: 0, failed: 0, errors: [] };
        // 매입일자별로 그룹화
        const groupedData = {};
        for (const row of data) {
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
                const firstRow = rows[0];
                // 거래처 찾기
                const customer = await customerRepo.findOne({
                    where: { businessId, customerCode: firstRow['거래처코드'] }
                });
                // 매입 생성
                const totalAmount = rows.reduce((sum, r) => sum + parseFloat(r['금액']), 0);
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
            }
            catch (error) {
                results.failed++;
                results.errors.push(`${key}: ${error.message}`);
            }
        }
        res.json({
            success: true,
            message: `업로드 완료 - 성공: ${results.success}, 실패: ${results.failed}`,
            results
        });
    }
    catch (error) {
        console.error('매입 업로드 오류:', error);
        res.status(500).json({ success: false, message: '업로드 중 오류가 발생했습니다.' });
    }
};
exports.uploadPurchases = uploadPurchases;
//# sourceMappingURL=ExcelController.js.map