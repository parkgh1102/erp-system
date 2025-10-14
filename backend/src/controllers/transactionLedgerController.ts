import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { Payment } from '../entities/Payment';
import dayjs from 'dayjs';

interface LedgerEntry {
  id: number;
  date: string;
  type: 'sales' | 'purchase' | 'receipt' | 'payment';
  description: string;
  customerName: string;
  amount: number;
  supplyAmount: number;  // 공급가액
  vatAmount: number;     // 세액
  totalAmount: number;   // 합계
  balance: number;
  memo?: string;
  itemInfo?: {
    itemCode: string;
    itemName: string;
    spec?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  };
  itemCount?: number;  // 품목 개수
}

interface LedgerData {
  companyName: string;
  companyAddress?: string;
  fromCompany: {
    name: string;
    businessNumber: string;
    representative: string;
    address: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  toCompany: {
    name: string;
    businessNumber: string;
    representative: string;
    address: string;
    phone?: string;
    email?: string;
  };
  period: {
    start: string;
    end: string;
  };
  previousBalance: number;
  entries: LedgerEntry[];
  totalPurchase: number;
  totalPayment: number;
  totalSales: number;
  totalReceipt: number;
  finalBalance: number;
  transactionCount: number;
  totalQuantity: number;
}

export const transactionLedgerController = {
  // 거래원장 조회
  async getLedger(req: Request, res: Response) {
    try {
      console.log('📊 거래원장 조회 요청:', {
        params: req.params,
        query: req.query
      });

      const { businessId } = req.params;
      const { customerId, startDate, endDate } = req.query;

      const customerRepository = AppDataSource.getRepository(Customer);
      const salesRepository = AppDataSource.getRepository(Sales);
      const purchaseRepository = AppDataSource.getRepository(Purchase);
      const paymentRepository = AppDataSource.getRepository(Payment);

      // 거래처 정보 조회
      const customer = await customerRepository.findOne({
        where: { id: Number(customerId), businessId: Number(businessId) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      // 날짜 범위 설정
      const start = startDate ? dayjs(startDate as string) : dayjs().startOf('month');
      const end = endDate ? dayjs(endDate as string) : dayjs().endOf('month');

      // 매출 데이터 조회
      const sales = await salesRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
          // 날짜 범위 조건은 실제 구현에 따라 수정 필요
        },
        relations: ['customer', 'items']
      });

      // 매입 데이터 조회
      const purchases = await purchaseRepository.find({
        where: {
          businessId: Number(businessId),
        },
        relations: ['customer', 'items']
      });

      // 지급/수금 데이터 조회
      const payments = await paymentRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['customer']
      });

      // 거래원장 엔트리 생성
      const entries: LedgerEntry[] = [];
      let runningBalance = 0;

      // 매출 항목 추가
      sales.forEach((sale) => {
        // Sale의 totalAmount를 직접 사용 (이미 계산되어 저장된 값)
        const totalAmount = sale.totalAmount + sale.vatAmount;

        runningBalance += totalAmount;

        // 품목 개수 계산
        const itemCount = sale.items?.length || 0;

        entries.push({
          id: sale.id,
          date: dayjs(sale.transactionDate).format('YYYY-MM-DD'),
          type: 'sales',
          description: '매출',
          customerName: customer.name,
          amount: sale.totalAmount,
          supplyAmount: sale.totalAmount,  // Sale의 totalAmount가 공급가액
          vatAmount: sale.vatAmount,        // Sale의 vatAmount
          totalAmount: totalAmount,         // 공급가액 + 세액
          balance: runningBalance,
          memo: sale.memo || sale.description || '',
          itemCount: itemCount,  // 품목 개수 추가
          itemInfo: sale.items && sale.items[0] ? {
            itemCode: sale.items[0].productId?.toString() || '',
            itemName: sale.items[0].itemName || '',
            spec: sale.items[0].specification || '',
            quantity: sale.items[0].quantity || 0,
            unitPrice: sale.items[0].unitPrice || 0,
            amount: sale.items[0].supplyAmount || 0
          } : undefined
        });
      });

      // 매입 항목 추가
      purchases.forEach((purchase) => {
        // Purchase의 totalAmount는 공급가액, vatAmount는 세액
        const supplyAmount = purchase.totalAmount;  // 공급가액
        const vatAmount = purchase.vatAmount;       // 세액
        const totalAmount = supplyAmount + vatAmount;  // 합계 (공급가액 + 세액)

        runningBalance -= totalAmount;

        // 품목 개수 계산
        const itemCount = purchase.items?.length || 0;

        entries.push({
          id: purchase.id + 10000,
          date: dayjs(purchase.purchaseDate).format('YYYY-MM-DD'),
          type: 'purchase',
          description: '매입',
          customerName: customer.name,
          amount: purchase.totalAmount,
          supplyAmount: supplyAmount,
          vatAmount: vatAmount,
          totalAmount: totalAmount,
          balance: runningBalance,
          memo: purchase.memo || '',
          itemCount: itemCount,  // 품목 개수 추가
          itemInfo: purchase.items && purchase.items[0] ? {
            itemCode: purchase.items[0].productId?.toString() || '',
            itemName: purchase.items[0].productName || '',
            spec: purchase.items[0].spec || '',
            quantity: purchase.items[0].quantity || 0,
            unitPrice: purchase.items[0].unitPrice || 0,
            amount: purchase.items[0].amount || 0
          } : undefined
        });
      });

      // 지급/수금 항목 추가
      payments.forEach((payment) => {
        const isReceipt = payment.paymentType === '수금';
        if (isReceipt) {
          runningBalance -= payment.amount;
        } else {
          runningBalance += payment.amount;
        }

        entries.push({
          id: payment.id + 20000,
          date: dayjs(payment.paymentDate).format('YYYY-MM-DD'),
          type: isReceipt ? 'receipt' : 'payment',
          description: isReceipt ? '수금' : '지급',
          customerName: customer.name,
          amount: payment.amount,
          supplyAmount: payment.amount,  // 수금/지급은 세액 없이 전체 금액
          vatAmount: 0,
          totalAmount: payment.amount,
          balance: runningBalance,
          memo: payment.memo || ''
        });
      });

      // 날짜순 정렬
      entries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

      // 집계 계산
      const totalSales = entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + e.amount, 0);
      const totalPurchase = entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + e.amount, 0);
      const totalReceipt = entries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + e.amount, 0);
      const totalPayment = entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);
      const finalBalance = totalSales - totalPurchase - totalReceipt + totalPayment;
      const totalQuantity = entries.reduce((sum, e) => sum + (e.itemInfo?.quantity || 0), 0);

      const ledgerData: LedgerData = {
        companyName: customer.name,
        companyAddress: customer.address,
        fromCompany: {
          name: '가온에프에스유한회사',
          businessNumber: '818-87-01513',
          representative: '이수연',
          address: '경기도 남양주시 오남읍 양지로125번길 6, 에이동',
          phone: '',
          fax: '',
          email: 'business@gaonfscorp.com'
        },
        toCompany: {
          name: customer.name,
          businessNumber: customer.businessNumber || '',
          representative: customer.representative || '',
          address: customer.address || '',
          phone: customer.phone || '',
          email: customer.email || ''
        },
        period: {
          start: start.format('YYYY-MM-DD'),
          end: end.format('YYYY-MM-DD')
        },
        previousBalance: 0,
        entries,
        totalPurchase,
        totalPayment,
        totalSales,
        totalReceipt,
        finalBalance,
        transactionCount: entries.length,
        totalQuantity
      };

      res.json({
        success: true,
        data: ledgerData
      });
    } catch (error: any) {
      console.error('❌ 거래원장 조회 오류:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: '거래원장 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  },

  // 거래원장 상세 내역 조회
  async getLedgerDetails(req: Request, res: Response) {
    try {
      // const { businessId: _businessId } = req.params;
      // const { customerId: _customerId, startDate: _startDate, endDate: _endDate, type: _type } = req.query;

      // 간단한 mock 데이터 반환
      const mockDetails = [
        {
          id: 1,
          date: dayjs().format('YYYY-MM-DD'),
          type: 'sales',
          description: '매출',
          amount: 1000000,
          balance: 1000000,
          memo: '거래완료'
        }
      ];

      res.json({
        success: true,
        data: mockDetails
      });
    } catch (error) {
      console.error('거래원장 상세 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '거래원장 상세 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 거래원장 요약 정보 조회
  async getLedgerSummary(req: Request, res: Response) {
    try {
      // const { businessId: _businessId } = req.params;
      // const { customerId: _customerId, startDate: _startDate, endDate: _endDate } = req.query;

      // 간단한 mock 데이터 반환
      const mockSummary = {
        totalSales: 5000000,
        totalPurchase: 2000000,
        totalReceipt: 3000000,
        totalPayment: 1000000,
        finalBalance: 1000000,
        transactionCount: 15
      };

      res.json({
        success: true,
        data: mockSummary
      });
    } catch (error) {
      console.error('거래원장 요약 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '거래원장 요약 조회 중 오류가 발생했습니다.'
      });
    }
  },

  // 거래처별 잔액 조회
  async getCustomerBalance(req: Request, res: Response) {
    try {
      const { businessId, customerId } = req.params;

      const customerRepository = AppDataSource.getRepository(Customer);
      const customer = await customerRepository.findOne({
        where: { id: Number(customerId), businessId: Number(businessId) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      // 임시 잔액 계산 로직
      const balance = 500000; // 실제로는 매출-매입-수금+지급 계산

      res.json({
        success: true,
        data: {
          customerId: Number(customerId),
          customerName: customer.name,
          balance: balance,
          lastTransactionDate: dayjs().format('YYYY-MM-DD')
        }
      });
    } catch (error) {
      console.error('거래처 잔액 조회 오류:', error);
      res.status(500).json({
        success: false,
        message: '거래처 잔액 조회 중 오류가 발생했습니다.'
      });
    }
  }
};