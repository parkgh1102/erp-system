"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const database_1 = require("../config/database");
const CompanySettings_1 = require("../entities/CompanySettings");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Sales_1 = require("../entities/Sales");
const Purchase_1 = require("../entities/Purchase");
const User_1 = require("../entities/User");
const Business_1 = require("../entities/Business");
const logger_1 = require("../utils/logger");
const exceljs_1 = __importDefault(require("exceljs"));
const settingsRepository = database_1.AppDataSource.getRepository(CompanySettings_1.CompanySettings);
const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
const productRepository = database_1.AppDataSource.getRepository(Product_1.Product);
const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
const userRepository = database_1.AppDataSource.getRepository(User_1.User);
const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
exports.SettingsController = {
    // 이메일로 보안 설정 조회 (로그인 전 - 인증 불필요)
    async getSecuritySettingsByEmail(req, res) {
        try {
            const { email } = req.params;
            // 사용자 찾기
            const user = await userRepository.findOne({
                where: { email },
                relations: ['businesses']
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: '사용자를 찾을 수 없습니다.'
                });
            }
            // sales_viewer인 경우 businessId로 비즈니스 정보 조회
            let businessId;
            if (user.role === 'sales_viewer' && user.businessId) {
                businessId = user.businessId;
            }
            else if (user.businesses && user.businesses.length > 0) {
                businessId = user.businesses[0].id;
            }
            if (!businessId) {
                // 비즈니스가 없으면 기본값 반환 (2단계 인증 OFF)
                return res.json({
                    success: true,
                    data: {
                        twoFactorAuth: false,
                        sessionTimeout: '8h'
                    }
                });
            }
            // 보안 설정 조회
            const settings = await settingsRepository.find({
                where: { businessId }
            });
            const settingsObject = {};
            settings.forEach(setting => {
                settingsObject[setting.settingKey] = setting.settingValue;
            });
            res.json({
                success: true,
                data: {
                    twoFactorAuth: settingsObject['twoFactorAuth'] === 'true',
                    sessionTimeout: settingsObject['sessionTimeout'] || '8h'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get security settings by email error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '보안 설정 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 설정 조회
    async getSettings(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const settings = await settingsRepository.find({
                where: { businessId }
            });
            // 설정을 객체 형태로 변환
            const settingsObject = {};
            settings.forEach(setting => {
                settingsObject[setting.settingKey] = setting.settingValue;
            });
            res.json({
                success: true,
                data: settingsObject
            });
        }
        catch (error) {
            logger_1.logger.error('Get settings error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '설정 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 설정 저장
    async updateSettings(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const settingsData = req.body;
            // 각 설정 키에 대해 업데이트 또는 생성
            for (const [key, value] of Object.entries(settingsData)) {
                const existing = await settingsRepository.findOne({
                    where: { businessId, settingKey: key }
                });
                if (existing) {
                    existing.settingValue = String(value);
                    await settingsRepository.save(existing);
                }
                else {
                    const newSetting = settingsRepository.create({
                        businessId,
                        settingKey: key,
                        settingValue: String(value)
                    });
                    await settingsRepository.save(newSetting);
                }
            }
            res.json({
                success: true,
                message: '설정이 저장되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Update settings error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '설정 저장 중 오류가 발생했습니다.'
            });
        }
    },
    // 거래처 데이터 내보내기
    async exportCustomers(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const customers = await customerRepository.find({
                where: { businessId }
            });
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet('거래처');
            worksheet.columns = [
                { header: '거래처명', key: 'name', width: 20 },
                { header: '사업자번호', key: 'businessNumber', width: 15 },
                { header: '대표자', key: 'representative', width: 15 },
                { header: '전화번호', key: 'phone', width: 15 },
                { header: '주소', key: 'address', width: 30 },
                { header: '이메일', key: 'email', width: 25 },
            ];
            customers.forEach(customer => {
                worksheet.addRow({
                    name: customer.name,
                    businessNumber: customer.businessNumber || '',
                    representative: customer.representative || '',
                    phone: customer.phone || '',
                    address: customer.address || '',
                    email: customer.email || '',
                });
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            logger_1.logger.error('Export customers error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '거래처 데이터 내보내기 중 오류가 발생했습니다.'
            });
        }
    },
    // 품목 데이터 내보내기
    async exportProducts(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const products = await productRepository.find({
                where: { businessId }
            });
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet('품목');
            worksheet.columns = [
                { header: '품목명', key: 'name', width: 20 },
                { header: '품목코드', key: 'productCode', width: 15 },
                { header: '규격', key: 'specification', width: 15 },
                { header: '단위', key: 'unit', width: 10 },
                { header: '매입가', key: 'buyPrice', width: 12 },
                { header: '판매가', key: 'sellPrice', width: 12 },
                { header: '과세구분', key: 'taxType', width: 10 },
            ];
            products.forEach(product => {
                worksheet.addRow({
                    name: product.name,
                    productCode: product.productCode || '',
                    specification: product.specification || '',
                    unit: product.unit || '',
                    buyPrice: product.buyPrice || 0,
                    sellPrice: product.sellPrice || 0,
                    taxType: product.taxType || '',
                });
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            logger_1.logger.error('Export products error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '품목 데이터 내보내기 중 오류가 발생했습니다.'
            });
        }
    },
    // 매출/매입 데이터 내보내기
    async exportTransactions(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const sales = await salesRepository.find({
                where: { businessId },
                relations: ['customer']
            });
            const purchases = await purchaseRepository.find({
                where: { businessId },
                relations: ['customer']
            });
            const workbook = new exceljs_1.default.Workbook();
            // 매출 시트
            const salesSheet = workbook.addWorksheet('매출');
            salesSheet.columns = [
                { header: '날짜', key: 'date', width: 12 },
                { header: '거래처', key: 'customer', width: 20 },
                { header: '공급가액', key: 'supplyAmount', width: 15 },
                { header: '부가세', key: 'taxAmount', width: 12 },
                { header: '합계', key: 'totalAmount', width: 15 },
                { header: '비고', key: 'memo', width: 30 },
            ];
            sales.forEach(sale => {
                salesSheet.addRow({
                    date: sale.transactionDate,
                    customer: sale.customer?.name || '',
                    supplyAmount: sale.totalAmount,
                    taxAmount: sale.vatAmount,
                    totalAmount: (sale.totalAmount || 0) + (sale.vatAmount || 0),
                    memo: sale.memo || '',
                });
            });
            // 매입 시트
            const purchasesSheet = workbook.addWorksheet('매입');
            purchasesSheet.columns = [
                { header: '날짜', key: 'date', width: 12 },
                { header: '거래처', key: 'customer', width: 20 },
                { header: '공급가액', key: 'supplyAmount', width: 15 },
                { header: '부가세', key: 'taxAmount', width: 12 },
                { header: '합계', key: 'totalAmount', width: 15 },
                { header: '비고', key: 'memo', width: 30 },
            ];
            purchases.forEach(purchase => {
                purchasesSheet.addRow({
                    date: purchase.purchaseDate,
                    customer: purchase.customer?.name || '',
                    supplyAmount: purchase.totalAmount,
                    taxAmount: purchase.vatAmount,
                    totalAmount: (purchase.totalAmount || 0) + (purchase.vatAmount || 0),
                    memo: purchase.memo || '',
                });
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            logger_1.logger.error('Export transactions error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '매출/매입 데이터 내보내기 중 오류가 발생했습니다.'
            });
        }
    },
    // 전체 데이터 내보내기
    async exportAll(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const customers = await customerRepository.find({ where: { businessId } });
            const products = await productRepository.find({ where: { businessId } });
            const sales = await salesRepository.find({
                where: { businessId },
                relations: ['customer', 'items']
            });
            const purchases = await purchaseRepository.find({
                where: { businessId },
                relations: ['customer', 'items']
            });
            const workbook = new exceljs_1.default.Workbook();
            // 거래처 시트
            const customersSheet = workbook.addWorksheet('거래처');
            customersSheet.columns = [
                { header: '거래처코드', key: 'customerCode', width: 15 },
                { header: '거래처명', key: 'name', width: 20 },
                { header: '사업자번호', key: 'businessNumber', width: 15 },
                { header: '대표자', key: 'representative', width: 15 },
                { header: '전화번호', key: 'phone', width: 15 },
                { header: '주소', key: 'address', width: 30 },
                { header: '이메일', key: 'email', width: 25 },
            ];
            customers.forEach(customer => {
                customersSheet.addRow({
                    customerCode: customer.customerCode || '',
                    name: customer.name,
                    businessNumber: customer.businessNumber || '',
                    representative: customer.representative || '',
                    phone: customer.phone || '',
                    address: customer.address || '',
                    email: customer.email || '',
                });
            });
            // 품목 시트
            const productsSheet = workbook.addWorksheet('품목');
            productsSheet.columns = [
                { header: '품목코드', key: 'productCode', width: 15 },
                { header: '품목명', key: 'name', width: 20 },
                { header: '규격', key: 'specification', width: 15 },
                { header: '단위', key: 'unit', width: 10 },
                { header: '매입가', key: 'buyPrice', width: 12 },
                { header: '판매가', key: 'sellPrice', width: 12 },
                { header: '과세구분', key: 'taxType', width: 10 },
            ];
            products.forEach(product => {
                productsSheet.addRow({
                    productCode: product.productCode || '',
                    name: product.name,
                    specification: product.specification || '',
                    unit: product.unit || '',
                    buyPrice: product.buyPrice || 0,
                    sellPrice: product.sellPrice || 0,
                    taxType: product.taxType || '',
                });
            });
            // 매출 시트
            const salesSheet = workbook.addWorksheet('매출');
            salesSheet.columns = [
                { header: '날짜', key: 'date', width: 12 },
                { header: '거래처', key: 'customer', width: 20 },
                { header: '공급가액', key: 'supplyAmount', width: 15 },
                { header: '부가세', key: 'taxAmount', width: 12 },
                { header: '합계', key: 'totalAmount', width: 15 },
                { header: '비고', key: 'memo', width: 30 },
            ];
            sales.forEach(sale => {
                salesSheet.addRow({
                    date: sale.transactionDate,
                    customer: sale.customer?.name || '',
                    supplyAmount: sale.totalAmount,
                    taxAmount: sale.vatAmount,
                    totalAmount: (sale.totalAmount || 0) + (sale.vatAmount || 0),
                    memo: sale.memo || '',
                });
            });
            // 매입 시트
            const purchasesSheet = workbook.addWorksheet('매입');
            purchasesSheet.columns = [
                { header: '날짜', key: 'date', width: 12 },
                { header: '거래처', key: 'customer', width: 20 },
                { header: '공급가액', key: 'supplyAmount', width: 15 },
                { header: '부가세', key: 'taxAmount', width: 12 },
                { header: '합계', key: 'totalAmount', width: 15 },
                { header: '비고', key: 'memo', width: 30 },
            ];
            purchases.forEach(purchase => {
                purchasesSheet.addRow({
                    date: purchase.purchaseDate,
                    customer: purchase.customer?.name || '',
                    supplyAmount: purchase.totalAmount,
                    taxAmount: purchase.vatAmount,
                    totalAmount: (purchase.totalAmount || 0) + (purchase.vatAmount || 0),
                    memo: purchase.memo || '',
                });
            });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=all_data.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            logger_1.logger.error('Export all data error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '전체 데이터 내보내기 중 오류가 발생했습니다.'
            });
        }
    },
    // 모든 데이터 초기화
    async resetAllData(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const { confirmText } = req.body;
            // 확인 텍스트 검증
            if (confirmText !== '데이터 초기화') {
                return res.status(400).json({
                    success: false,
                    message: '확인 텍스트가 일치하지 않습니다.'
                });
            }
            // 트랜잭션으로 모든 데이터 삭제
            await database_1.AppDataSource.transaction(async (transactionalEntityManager) => {
                // 매출 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM sales_items WHERE "salesId" IN (SELECT id FROM sales WHERE "businessId" = $1)`, [businessId]);
                // 매입 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM purchase_items WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "businessId" = $1)`, [businessId]);
                // 매출 삭제
                await transactionalEntityManager.query(`DELETE FROM sales WHERE "businessId" = $1`, [businessId]);
                // 매입 삭제
                await transactionalEntityManager.query(`DELETE FROM purchases WHERE "businessId" = $1`, [businessId]);
                // 수금 삭제
                await transactionalEntityManager.query(`DELETE FROM payments WHERE "businessId" = $1`, [businessId]);
                // 거래처 삭제
                await transactionalEntityManager.query(`DELETE FROM customers WHERE "businessId" = $1`, [businessId]);
                // 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM products WHERE "businessId" = $1`, [businessId]);
            });
            logger_1.logger.info(`All data reset for businessId: ${businessId}`);
            res.json({
                success: true,
                message: '모든 데이터가 초기화되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Reset all data error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '데이터 초기화 중 오류가 발생했습니다.'
            });
        }
    },
    // 계정 삭제
    async deleteAccount(req, res) {
        try {
            const businessId = parseInt(req.params.businessId);
            const userId = req.user?.id;
            const { confirmText } = req.body;
            // 확인 텍스트 검증
            if (confirmText !== '계정 삭제') {
                return res.status(400).json({
                    success: false,
                    message: '확인 텍스트가 일치하지 않습니다.'
                });
            }
            // 트랜잭션으로 모든 데이터 및 계정 삭제
            await database_1.AppDataSource.transaction(async (transactionalEntityManager) => {
                // 매출 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM sales_items WHERE "salesId" IN (SELECT id FROM sales WHERE "businessId" = $1)`, [businessId]);
                // 매입 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM purchase_items WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "businessId" = $1)`, [businessId]);
                // 매출 삭제
                await transactionalEntityManager.query(`DELETE FROM sales WHERE "businessId" = $1`, [businessId]);
                // 매입 삭제
                await transactionalEntityManager.query(`DELETE FROM purchases WHERE "businessId" = $1`, [businessId]);
                // 수금 삭제
                await transactionalEntityManager.query(`DELETE FROM payments WHERE "businessId" = $1`, [businessId]);
                // 거래처 삭제
                await transactionalEntityManager.query(`DELETE FROM customers WHERE "businessId" = $1`, [businessId]);
                // 품목 삭제
                await transactionalEntityManager.query(`DELETE FROM products WHERE "businessId" = $1`, [businessId]);
                // 설정 삭제
                await transactionalEntityManager.query(`DELETE FROM company_settings WHERE "businessId" = $1`, [businessId]);
                // 활동 로그 삭제
                await transactionalEntityManager.query(`DELETE FROM activity_logs WHERE "businessId" = $1`, [businessId]);
                // 사업체 삭제
                await transactionalEntityManager.query(`DELETE FROM businesses WHERE id = $1`, [businessId]);
                // 사용자 삭제 (관리자 계정)
                if (userId) {
                    await transactionalEntityManager.query(`DELETE FROM users WHERE id = $1`, [userId]);
                }
            });
            logger_1.logger.info(`Account deleted for businessId: ${businessId}, userId: ${userId}`);
            res.json({
                success: true,
                message: '계정이 삭제되었습니다.'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete account error', error instanceof Error ? error : new Error(String(error)));
            res.status(500).json({
                success: false,
                message: '계정 삭제 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=SettingsController.js.map