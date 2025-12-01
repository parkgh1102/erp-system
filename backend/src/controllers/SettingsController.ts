import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { CompanySettings } from '../entities/CompanySettings';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { User } from '../entities/User';
import { Business } from '../entities/Business';
import { logger } from '../utils/logger';
import ExcelJS from 'exceljs';

const settingsRepository = AppDataSource.getRepository(CompanySettings);
const customerRepository = AppDataSource.getRepository(Customer);
const productRepository = AppDataSource.getRepository(Product);
const salesRepository = AppDataSource.getRepository(Sales);
const purchaseRepository = AppDataSource.getRepository(Purchase);
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

      const settingsObject: Record<string, string> = {};
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
  }
};
