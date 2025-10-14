import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { Customer, CustomerType } from '../entities/Customer';
import { Product } from '../entities/Product';
import dayjs from 'dayjs';

export class SampleDataController {
  static async createSampleData(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const businessIdNum = parseInt(businessId);

      const salesRepo = AppDataSource.getRepository(Sales);
      const purchaseRepo = AppDataSource.getRepository(Purchase);
      const customerRepo = AppDataSource.getRepository(Customer);
      const productRepo = AppDataSource.getRepository(Product);

      // 샘플 고객 데이터 생성
      const customers = [
        {
          businessId: businessIdNum,
          customerCode: 'CUST001',
          name: '한국농수산식품유통공사',
          businessNumber: '1234567890',
          representative: '김대표',
          customerType: CustomerType.SALES,
          isActive: true
        },
        {
          businessId: businessIdNum,
          customerCode: 'CUST002',
          name: '풀무원푸드앤컬처',
          businessNumber: '2345678901',
          representative: '이대표',
          customerType: CustomerType.PURCHASE,
          isActive: true
        },
        {
          businessId: businessIdNum,
          customerCode: 'CUST003',
          name: 'CJ제일제당',
          businessNumber: '3456789012',
          representative: '박대표',
          customerType: CustomerType.SALES,
          isActive: true
        },
        {
          businessId: businessIdNum,
          customerCode: 'CUST004',
          name: '농심',
          businessNumber: '4567890123',
          representative: '최대표',
          customerType: CustomerType.PURCHASE,
          isActive: true
        },
        {
          businessId: businessIdNum,
          customerCode: 'CUST005',
          name: '롯데식품',
          businessNumber: '5678901234',
          representative: '정대표',
          customerType: CustomerType.SALES,
          isActive: true
        }
      ];

      // 고객 데이터 저장
      const savedCustomers = await customerRepo.save(customers);

      // 샘플 제품 데이터 생성
      const products = [
        {
          businessId: businessIdNum,
          name: '프리미엄 쌀',
          productCode: 'RICE001',
          spec: '20kg',
          unit: '포',
          buyPrice: 45000,
          sellPrice: 55000,
          category: '식품',
          taxType: 'tax_separate',
          isActive: true
        },
        {
          businessId: businessIdNum,
          name: '유기농 야채',
          productCode: 'VEG001',
          spec: '1box',
          unit: '박스',
          buyPrice: 25000,
          sellPrice: 35000,
          category: '식품',
          taxType: 'tax_separate',
          isActive: true
        },
        {
          businessId: businessIdNum,
          name: '냉동 육류',
          productCode: 'MEAT001',
          spec: '5kg',
          unit: 'kg',
          buyPrice: 80000,
          sellPrice: 95000,
          category: '식품',
          taxType: 'tax_separate',
          isActive: true
        }
      ];

      // 제품 데이터 저장
      const savedProducts = await productRepo.save(products);

      // 샘플 매출 데이터 생성 (최근 30일)
      const salesData = [];
      for (let i = 0; i < 15; i++) {
        const randomCustomer = savedCustomers[Math.floor(Math.random() * savedCustomers.length)];
        const baseAmount = Math.floor(Math.random() * 2000000) + 500000; // 50만원 ~ 250만원

        salesData.push({
          businessId: businessIdNum,
          customerId: randomCustomer.id,
          transactionDate: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toDate(),
          totalAmount: baseAmount,
          vatAmount: Math.floor(baseAmount * 0.1),
          description: `매출 거래 - ${randomCustomer.name}`
        });
      }

      // 매출 데이터 저장
      await salesRepo.save(salesData);

      // 샘플 매입 데이터 생성 (최근 30일)
      const purchaseData = [];
      for (let i = 0; i < 10; i++) {
        const suppliers = ['풀무원푸드앤컬처', '농심', '대상', '오뚜기', '동원F&B'];
        const supplierName = suppliers[Math.floor(Math.random() * suppliers.length)];
        const baseAmount = Math.floor(Math.random() * 1500000) + 300000; // 30만원 ~ 180만원

        purchaseData.push({
          businessId: businessIdNum,
          supplierName,
          transactionDate: dayjs().subtract(Math.floor(Math.random() * 30), 'day').toDate(),
          totalAmount: baseAmount,
          vatAmount: Math.floor(baseAmount * 0.1),
          description: `매입 거래 - ${supplierName}`
        });
      }

      // 매입 데이터 저장
      await purchaseRepo.save(purchaseData);

      res.json({
        success: true,
        message: '샘플 데이터가 생성되었습니다.',
        data: {
          customers: savedCustomers.length,
          products: savedProducts.length,
          sales: salesData.length,
          purchases: purchaseData.length
        }
      });
    } catch (error) {
      console.error('Sample data creation error:', error);
      res.status(500).json({ success: false, message: '샘플 데이터 생성에 실패했습니다.' });
    }
  }
}