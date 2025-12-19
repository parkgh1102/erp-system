import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { CompanySettings } from '../entities/CompanySettings';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { Payment } from '../entities/Payment';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';

const settingsRepository = AppDataSource.getRepository(CompanySettings);
const customerRepository = AppDataSource.getRepository(Customer);
const productRepository = AppDataSource.getRepository(Product);
const salesRepository = AppDataSource.getRepository(Sales);
const purchaseRepository = AppDataSource.getRepository(Purchase);
const paymentRepository = AppDataSource.getRepository(Payment);
const userRepository = AppDataSource.getRepository(User);
const businessRepository = AppDataSource.getRepository(Business);

export const SettingsController = {
  // 이메일로 보안 설정 조회 (로그인 전 - 인증 불필요)
  async getSecuritySettingsByEmail(req: Request, res: Response) {
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
      let businessId: number | undefined;
      if (user.role === 'sales_viewer' && user.businessId) {
        businessId = user.businessId;
      } else if (user.businesses && user.businesses.length > 0) {
        businessId = user.businesses[0].id;
      }

      if (!businessId) {
        // 비즈니스가 없으면 기본값 반환 (2단계 인증 ON)
        return res.json({
          success: true,
          data: {
            twoFactorAuth: true,
            sessionTimeout: '8h'
          }
        });
      }

      // 보안 설정 조회
      const settings = await settingsRepository.find({
        where: { businessId }
      });

      const settingsObject: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObject[setting.settingKey] = setting.settingValue;
      });

      res.json({
        success: true,
        data: {
          // 설정이 없으면 기본값 ON (true)
          twoFactorAuth: settingsObject['twoFactorAuth'] === undefined ? true : settingsObject['twoFactorAuth'] === 'true',
          sessionTimeout: settingsObject['sessionTimeout'] || '8h'
        }
      });
    } catch (error: unknown) {
      logger.error('Get security settings by email error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '보안 설정 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 설정 조회
  async getSettings(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);

      const settings = await settingsRepository.find({
        where: { businessId }
      });

      // 설정을 객체 형태로 변환
      const settingsObject: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObject[setting.settingKey] = setting.settingValue;
      });

      res.json({
        success: true,
        data: settingsObject
      });
    } catch (error: unknown) {
      logger.error('Get settings error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '설정 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 설정 저장
  async updateSettings(req: Request, res: Response) {
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
        } else {
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
    } catch (error: unknown) {
      logger.error('Update settings error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '설정 저장 중 오류가 발생했습니다.'
      });
    }
  },

  // 거래처 데이터 내보내기
  async exportCustomers(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);

      const customers = await customerRepository.find({
        where: { businessId }
      });

      const workbook = new ExcelJS.Workbook();
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
    } catch (error: unknown) {
      logger.error('Export customers error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '거래처 데이터 내보내기 중 오류가 발생했습니다.'
      });
    }
  },

  // 품목 데이터 내보내기
  async exportProducts(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);

      const products = await productRepository.find({
        where: { businessId }
      });

      const workbook = new ExcelJS.Workbook();
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
    } catch (error: unknown) {
      logger.error('Export products error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '품목 데이터 내보내기 중 오류가 발생했습니다.'
      });
    }
  },

  // 매출/매입 데이터 내보내기
  async exportTransactions(req: Request, res: Response) {
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

      const workbook = new ExcelJS.Workbook();

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
    } catch (error: unknown) {
      logger.error('Export transactions error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '매출/매입 데이터 내보내기 중 오류가 발생했습니다.'
      });
    }
  },

  // 전체 데이터 내보내기
  async exportAll(req: Request, res: Response) {
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

      const workbook = new ExcelJS.Workbook();

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
    } catch (error: unknown) {
      logger.error('Export all data error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '전체 데이터 내보내기 중 오류가 발생했습니다.'
      });
    }
  },

  // 모든 데이터 초기화
  async resetAllData(req: Request, res: Response) {
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
      await AppDataSource.transaction(async transactionalEntityManager => {
        // 매출 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM sales_items WHERE "salesId" IN (SELECT id FROM sales WHERE "businessId" = $1)`,
          [businessId]
        );
        // 매입 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM purchase_items WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "businessId" = $1)`,
          [businessId]
        );
        // 매출 삭제
        await transactionalEntityManager.query(
          `DELETE FROM sales WHERE "businessId" = $1`,
          [businessId]
        );
        // 매입 삭제
        await transactionalEntityManager.query(
          `DELETE FROM purchases WHERE "businessId" = $1`,
          [businessId]
        );
        // 수금 삭제
        await transactionalEntityManager.query(
          `DELETE FROM payments WHERE "businessId" = $1`,
          [businessId]
        );
        // 거래처 삭제
        await transactionalEntityManager.query(
          `DELETE FROM customers WHERE "businessId" = $1`,
          [businessId]
        );
        // 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM products WHERE "businessId" = $1`,
          [businessId]
        );
      });

      logger.info(`All data reset for businessId: ${businessId}`);

      res.json({
        success: true,
        message: '모든 데이터가 초기화되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Reset all data error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '데이터 초기화 중 오류가 발생했습니다.'
      });
    }
  },

  // 데이터 백업 (JSON 다운로드)
  async backupData(req: Request, res: Response) {
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

      // Payment 조회
      const payments = await paymentRepository.find({
        where: { businessId },
        relations: ['customer']
      });

      const backupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        businessId,
        data: {
          customers: customers.map(c => ({
            customerCode: c.customerCode,
            name: c.name,
            businessNumber: c.businessNumber,
            representative: c.representative,
            phone: c.phone,
            address: c.address,
            email: c.email,
            fax: c.fax,
            managerContact: c.managerContact,
            businessType: c.businessType,
            businessItem: c.businessItem,
            customerType: c.customerType
          })),
          products: products.map(p => ({
            productCode: p.productCode,
            name: p.name,
            spec: p.spec,
            specification: p.specification,
            unit: p.unit,
            buyPrice: p.buyPrice,
            sellPrice: p.sellPrice,
            taxType: p.taxType,
            category: p.category,
            memo: p.memo,
            currentStock: p.currentStock
          })),
          sales: sales.map(s => ({
            transactionDate: s.transactionDate,
            customerName: s.customer?.name,
            totalAmount: s.totalAmount,
            vatAmount: s.vatAmount,
            memo: s.memo,
            items: s.items?.map(item => ({
              itemName: item.itemName,
              specification: item.specification,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              supplyAmount: item.supplyAmount,
              taxAmount: item.taxAmount,
              remark: item.remark
            }))
          })),
          purchases: purchases.map(p => ({
            purchaseDate: p.purchaseDate,
            customerName: p.customer?.name,
            totalAmount: p.totalAmount,
            vatAmount: p.vatAmount,
            memo: p.memo,
            items: p.items?.map(item => ({
              productCode: item.productCode,
              productName: item.productName,
              spec: item.spec,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount
            }))
          })),
          payments: payments.map(p => ({
            paymentDate: p.paymentDate,
            customerName: p.customer?.name,
            paymentType: p.paymentType,
            amount: p.amount,
            memo: p.memo
          }))
        }
      };

      const filename = `backup_${businessId}_${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error: unknown) {
      logger.error('Backup data error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '데이터 백업 중 오류가 발생했습니다.'
      });
    }
  },

  // 데이터 복원 (JSON 업로드)
  async restoreData(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const backupData = req.body;

      // 백업 데이터 검증
      if (!backupData || !backupData.version || !backupData.data) {
        return res.status(400).json({
          success: false,
          message: '유효하지 않은 백업 파일입니다.'
        });
      }

      // 트랜잭션으로 복원 처리
      await AppDataSource.transaction(async transactionalEntityManager => {
        // 1. 기존 데이터 삭제 (역순으로)
        await transactionalEntityManager.query(
          `DELETE FROM sales_items WHERE "salesId" IN (SELECT id FROM sales WHERE "businessId" = $1)`,
          [businessId]
        );
        await transactionalEntityManager.query(
          `DELETE FROM purchase_items WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "businessId" = $1)`,
          [businessId]
        );
        await transactionalEntityManager.query(`DELETE FROM sales WHERE "businessId" = $1`, [businessId]);
        await transactionalEntityManager.query(`DELETE FROM purchases WHERE "businessId" = $1`, [businessId]);
        await transactionalEntityManager.query(`DELETE FROM payments WHERE "businessId" = $1`, [businessId]);
        await transactionalEntityManager.query(`DELETE FROM customers WHERE "businessId" = $1`, [businessId]);
        await transactionalEntityManager.query(`DELETE FROM products WHERE "businessId" = $1`, [businessId]);

        // 2. 거래처 복원
        const customerMap = new Map<string, number>(); // customerName -> customerId
        for (const customer of backupData.data.customers || []) {
          const result = await transactionalEntityManager.query(
            `INSERT INTO customers ("businessId", "customerCode", name, "businessNumber", representative, phone, address, email, fax, "managerContact", "businessType", "businessItem", "customerType", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING id`,
            [businessId, customer.customerCode, customer.name, customer.businessNumber, customer.representative, customer.phone, customer.address, customer.email, customer.fax, customer.managerContact, customer.businessType, customer.businessItem, customer.customerType || '기타']
          );
          if (result[0]?.id) {
            customerMap.set(customer.name, result[0].id);
          }
        }

        // 3. 품목 복원
        for (const product of backupData.data.products || []) {
          await transactionalEntityManager.query(
            `INSERT INTO products ("businessId", "productCode", name, spec, specification, unit, "buyPrice", "sellPrice", "taxType", category, memo, "currentStock", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
            [businessId, product.productCode, product.name, product.spec, product.specification, product.unit, product.buyPrice, product.sellPrice, product.taxType, product.category, product.memo, product.currentStock || 0]
          );
        }

        // 4. 매출 복원
        for (const sale of backupData.data.sales || []) {
          const customerId = customerMap.get(sale.customerName);
          if (!customerId) continue;

          const saleResult = await transactionalEntityManager.query(
            `INSERT INTO sales ("businessId", "customerId", "transactionDate", "totalAmount", "vatAmount", memo, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
            [businessId, customerId, sale.transactionDate, sale.totalAmount, sale.vatAmount, sale.memo]
          );

          const salesId = saleResult[0]?.id;
          if (salesId && sale.items) {
            for (const item of sale.items) {
              await transactionalEntityManager.query(
                `INSERT INTO sales_items ("salesId", "itemName", specification, unit, quantity, "unitPrice", "supplyAmount", "taxAmount", remark, "createdAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
                [salesId, item.itemName, item.specification, item.unit, item.quantity, item.unitPrice, item.supplyAmount, item.taxAmount || 0, item.remark]
              );
            }
          }
        }

        // 5. 매입 복원
        for (const purchase of backupData.data.purchases || []) {
          const customerId = customerMap.get(purchase.customerName);
          if (!customerId) continue;

          const purchaseResult = await transactionalEntityManager.query(
            `INSERT INTO purchases ("businessId", "customerId", "purchaseDate", "totalAmount", "vatAmount", memo, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
            [businessId, customerId, purchase.purchaseDate, purchase.totalAmount, purchase.vatAmount, purchase.memo]
          );

          const purchaseId = purchaseResult[0]?.id;
          if (purchaseId && purchase.items) {
            for (const item of purchase.items) {
              await transactionalEntityManager.query(
                `INSERT INTO purchase_items ("purchaseId", "productCode", "productName", spec, unit, quantity, "unitPrice", amount, "createdAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [purchaseId, item.productCode, item.productName, item.spec, item.unit, item.quantity, item.unitPrice, item.amount]
              );
            }
          }
        }

        // 6. 수금 복원
        for (const payment of backupData.data.payments || []) {
          const customerId = customerMap.get(payment.customerName);
          if (!customerId) continue;

          await transactionalEntityManager.query(
            `INSERT INTO payments ("businessId", "customerId", "paymentDate", "paymentType", amount, memo, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [businessId, customerId, payment.paymentDate, payment.paymentType, payment.amount, payment.memo]
          );
        }
      });

      logger.info(`Data restored for businessId: ${businessId}`);

      res.json({
        success: true,
        message: '데이터가 성공적으로 복원되었습니다.',
        summary: {
          customers: backupData.data.customers?.length || 0,
          products: backupData.data.products?.length || 0,
          sales: backupData.data.sales?.length || 0,
          purchases: backupData.data.purchases?.length || 0,
          payments: backupData.data.payments?.length || 0
        }
      });
    } catch (error: unknown) {
      logger.error('Restore data error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '데이터 복원 중 오류가 발생했습니다.'
      });
    }
  },

  // 계정 삭제
  async deleteAccount(req: Request, res: Response) {
    try {
      const businessId = parseInt(req.params.businessId);
      const userId = (req as any).user?.id;
      const { confirmText } = req.body;

      // 확인 텍스트 검증
      if (confirmText !== '계정 삭제') {
        return res.status(400).json({
          success: false,
          message: '확인 텍스트가 일치하지 않습니다.'
        });
      }

      // 트랜잭션으로 모든 데이터 및 계정 삭제
      await AppDataSource.transaction(async transactionalEntityManager => {
        // 매출 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM sales_items WHERE "salesId" IN (SELECT id FROM sales WHERE "businessId" = $1)`,
          [businessId]
        );
        // 매입 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM purchase_items WHERE "purchaseId" IN (SELECT id FROM purchases WHERE "businessId" = $1)`,
          [businessId]
        );
        // 매출 삭제
        await transactionalEntityManager.query(
          `DELETE FROM sales WHERE "businessId" = $1`,
          [businessId]
        );
        // 매입 삭제
        await transactionalEntityManager.query(
          `DELETE FROM purchases WHERE "businessId" = $1`,
          [businessId]
        );
        // 수금 삭제
        await transactionalEntityManager.query(
          `DELETE FROM payments WHERE "businessId" = $1`,
          [businessId]
        );
        // 거래처 삭제
        await transactionalEntityManager.query(
          `DELETE FROM customers WHERE "businessId" = $1`,
          [businessId]
        );
        // 품목 삭제
        await transactionalEntityManager.query(
          `DELETE FROM products WHERE "businessId" = $1`,
          [businessId]
        );
        // 설정 삭제
        await transactionalEntityManager.query(
          `DELETE FROM company_settings WHERE "businessId" = $1`,
          [businessId]
        );
        // 활동 로그 삭제
        await transactionalEntityManager.query(
          `DELETE FROM activity_logs WHERE "businessId" = $1`,
          [businessId]
        );
        // 사업체 삭제
        await transactionalEntityManager.query(
          `DELETE FROM businesses WHERE id = $1`,
          [businessId]
        );
        // 사용자 삭제 (관리자 계정)
        if (userId) {
          await transactionalEntityManager.query(
            `DELETE FROM users WHERE id = $1`,
            [userId]
          );
        }
      });

      logger.info(`Account deleted for businessId: ${businessId}, userId: ${userId}`);

      res.json({
        success: true,
        message: '계정이 삭제되었습니다.'
      });
    } catch (error: unknown) {
      logger.error('Delete account error', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        success: false,
        message: '계정 삭제 중 오류가 발생했습니다.'
      });
    }
  }
};
