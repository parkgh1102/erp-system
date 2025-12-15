import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { Payment } from '../entities/Payment';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


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

      console.log('📅 날짜 범위:', {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD')
      });

      // 전잔금 계산 (조회 시작일 이전의 잔액)
      let previousBalance = 0;

      // 모든 매출 데이터 조회 (전잔금 계산용)
      const allSalesForBalance = await salesRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['items']
      });

      // 모든 매입 데이터 조회 (전잔금 계산용)
      const allPurchasesForBalance = await purchaseRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['items']
      });

      // 모든 수금/지급 데이터 조회 (전잔금 계산용)
      const allPaymentsForBalance = await paymentRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        }
      });

      // 전잔금 계산: 시작일 이전 거래만 집계
      allSalesForBalance.forEach(sale => {
        const saleDate = dayjs(sale.transactionDate);
        if (saleDate.isBefore(start, 'day')) {
          const totalAmount = (Number(sale.totalAmount) || 0) + (Number(sale.vatAmount) || 0);
          previousBalance += totalAmount;
        }
      });

      allPurchasesForBalance.forEach(purchase => {
        const purchaseDate = dayjs(purchase.purchaseDate);
        if (purchaseDate.isBefore(start, 'day')) {
          const totalAmount = (Number(purchase.totalAmount) || 0) + (Number(purchase.vatAmount) || 0);
          previousBalance -= totalAmount;
        }
      });

      allPaymentsForBalance.forEach(payment => {
        const paymentDate = dayjs(payment.paymentDate);
        if (paymentDate.isBefore(start, 'day')) {
          const paymentAmount = Number(payment.amount) || 0;
          if (payment.paymentType === '수금' || payment.paymentType === '입금') {
            previousBalance -= paymentAmount;
          } else {
            previousBalance += paymentAmount;
          }
        }
      });

      console.log('💰 전잔금 계산 완료:', {
        previousBalance,
        beforeDate: start.subtract(1, 'day').format('YYYY-MM-DD')
      });

      // 매출 데이터 조회 (날짜 범위 포함)
      const allSales = await salesRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['customer', 'items']
      });

      // 날짜 범위 필터링
      const sales = allSales.filter(sale => {
        const saleDate = dayjs(sale.transactionDate);
        return saleDate.isSameOrAfter(start, 'day') && saleDate.isSameOrBefore(end, 'day');
      });

      console.log(`📊 매출 데이터: 전체 ${allSales.length}건, 필터링 후 ${sales.length}건`);

      // 매입 데이터 조회 (날짜 범위 포함)
      const allPurchases = await purchaseRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['customer', 'items']
      });

      // 날짜 범위 필터링
      const purchases = allPurchases.filter(purchase => {
        const purchaseDate = dayjs(purchase.purchaseDate);
        return purchaseDate.isSameOrAfter(start, 'day') && purchaseDate.isSameOrBefore(end, 'day');
      });

      console.log(`📊 매입 데이터: 전체 ${allPurchases.length}건, 필터링 후 ${purchases.length}건`);

      // 지급/수금 데이터 조회 (날짜 범위 포함)
      const allPayments = await paymentRepository.find({
        where: {
          customerId: Number(customerId),
          businessId: Number(businessId),
        },
        relations: ['customer']
      });

      // 날짜 범위 필터링
      const payments = allPayments.filter(payment => {
        const paymentDate = dayjs(payment.paymentDate);
        return paymentDate.isSameOrAfter(start, 'day') && paymentDate.isSameOrBefore(end, 'day');
      });

      console.log(`📊 수금/지급 데이터: 전체 ${allPayments.length}건, 필터링 후 ${payments.length}건`);

      // 거래원장 엔트리 생성
      const entries: LedgerEntry[] = [];
      let runningBalance = previousBalance; // 전잔금으로 시작

      // 매출 항목 추가
      sales.forEach((sale) => {
        // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
        let supplyAmount = Number(sale.totalAmount) || 0;
        let vatAmount = Number(sale.vatAmount) || 0;

        // totalAmount가 0이면 items에서 계산
        if (supplyAmount === 0 && sale.items && sale.items.length > 0) {
          supplyAmount = sale.items.reduce((sum, item) => sum + (Number(item.supplyAmount) || 0), 0);
          vatAmount = sale.items.reduce((sum, item) => sum + (Number(item.taxAmount) || 0), 0);
        }

        const totalAmount = supplyAmount + vatAmount;

        runningBalance += totalAmount;

        // 품목 개수 계산
        const itemCount = sale.items?.length || 0;

        entries.push({
          id: sale.id,
          date: dayjs(sale.transactionDate).format('YYYY-MM-DD'),
          type: 'sales',
          description: '매출',
          customerName: customer.name,
          amount: supplyAmount,
          supplyAmount: supplyAmount,  // Sale의 totalAmount가 공급가액
          vatAmount: vatAmount,        // Sale의 vatAmount
          totalAmount: totalAmount,    // 공급가액 + 세액
          balance: runningBalance,
          memo: sale.memo || sale.description || '',
          itemCount: itemCount,  // 품목 개수 추가
          itemInfo: sale.items && sale.items[0] ? {
            itemCode: sale.items[0].productId?.toString() || '',
            itemName: sale.items[0].itemName || '',
            spec: sale.items[0].specification || '',
            quantity: Number(sale.items[0].quantity) || 0,
            unitPrice: Number(sale.items[0].unitPrice) || 0,
            amount: Number(sale.items[0].supplyAmount) || 0
          } : undefined
        });
      });

      // 매입 항목 추가
      purchases.forEach((purchase) => {
        // Purchase의 totalAmount는 공급가액, vatAmount는 세액
        // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
        const supplyAmount = Number(purchase.totalAmount) || 0;  // 공급가액
        const vatAmount = Number(purchase.vatAmount) || 0;       // 세액
        const totalAmount = supplyAmount + vatAmount;    // 합계 (공급가액 + 세액)

        runningBalance -= totalAmount;

        // 품목 개수 계산
        const itemCount = purchase.items?.length || 0;

        entries.push({
          id: purchase.id + 10000,
          date: dayjs(purchase.purchaseDate).format('YYYY-MM-DD'),
          type: 'purchase',
          description: '매입',
          customerName: customer.name,
          amount: supplyAmount,
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
            quantity: Number(purchase.items[0].quantity) || 0,
            unitPrice: Number(purchase.items[0].unitPrice) || 0,
            amount: Number(purchase.items[0].amount) || 0
          } : undefined
        });
      });

      // 수금/입금 항목 추가
      payments.forEach((payment) => {
        // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
        const paymentAmount = Number(payment.amount) || 0;

        // 수금과 입금 모두 거래처로부터 돈을 받는 것으로 처리
        const isReceipt = payment.paymentType === '수금' || payment.paymentType === '입금';
        if (isReceipt) {
          runningBalance -= paymentAmount;
        } else {
          runningBalance += paymentAmount;
        }

        entries.push({
          id: payment.id + 20000,
          date: dayjs(payment.paymentDate).format('YYYY-MM-DD'),
          type: isReceipt ? 'receipt' : 'payment',
          description: payment.paymentType,  // 실제 paymentType 값 표시
          customerName: customer.name,
          amount: paymentAmount,
          supplyAmount: paymentAmount,  // 수금/입금은 세액 없이 전체 금액
          vatAmount: 0,
          totalAmount: paymentAmount,
          balance: runningBalance,
          memo: payment.memo || ''
        });
      });

      // 날짜순 정렬
      entries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

      // 정렬 후 잔액 재계산 (runningBalance) - 전잔금 포함
      let recalculatedBalance = previousBalance; // 전잔금부터 시작
      entries.forEach(entry => {
        if (entry.type === 'sales') {
          recalculatedBalance += entry.totalAmount;
        } else if (entry.type === 'purchase') {
          recalculatedBalance -= entry.totalAmount;
        } else if (entry.type === 'receipt') {
          recalculatedBalance -= entry.totalAmount;
        } else if (entry.type === 'payment') {
          recalculatedBalance += entry.totalAmount;
        }
        entry.balance = recalculatedBalance;
      });

      // 집계 계산 - NaN 방어를 위해 || 0 추가
      const totalSales = entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalPurchase = entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalReceipt = entries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalPayment = entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + (e.amount || 0), 0);
      const finalBalance = previousBalance + (totalSales || 0) - (totalPurchase || 0) - (totalReceipt || 0) + (totalPayment || 0);
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
        previousBalance: previousBalance,
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
      const { beforeDate } = req.query; // 특정 날짜 이전의 잔액 조회용

      console.log(`📊 전잔금 조회 - businessId: ${businessId}, customerId: ${customerId}, beforeDate: ${beforeDate}`);

      const customerRepository = AppDataSource.getRepository(Customer);
      const salesRepository = AppDataSource.getRepository(Sales);
      const purchaseRepository = AppDataSource.getRepository(Purchase);
      const paymentRepository = AppDataSource.getRepository(Payment);

      const customer = await customerRepository.findOne({
        where: { id: Number(customerId), businessId: Number(businessId) }
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: '거래처를 찾을 수 없습니다.'
        });
      }

      // 잔액 계산을 위한 날짜 설정 (beforeDate가 있으면 그 날짜 이전까지만 계산)
      const endDate = beforeDate ? dayjs(beforeDate as string) : dayjs();

      // 매출 데이터 조회 (전체 기간)
      const sales = await salesRepository.find({
        where: {
          businessId: Number(businessId),
          customerId: Number(customerId)
        },
        relations: ['items', 'customer']
      });

      // 매입 데이터 조회 (전체 기간)
      const purchases = await purchaseRepository.find({
        where: {
          businessId: Number(businessId),
          customerId: Number(customerId)
        },
        relations: ['items', 'customer']
      });

      // 수금/지급 데이터 조회 (전체 기간)
      const payments = await paymentRepository.find({
        where: {
          businessId: Number(businessId),
          customerId: Number(customerId)
        },
        relations: ['customer']
      });

      // 잔액 계산
      let balance = 0;
      let lastTransactionDate = null;

      console.log(`\n===== 잔액 계산 시작 (customerId: ${customerId}, beforeDate: ${beforeDate}) =====`);
      console.log(`🔍 발견된 payment 레코드 수: ${payments.length}`);
      payments.forEach((p, idx) => {
        console.log(`  Payment ${idx + 1}: id=${p.id}, date=${p.paymentDate}, type=${p.paymentType}, amount=${p.amount}`);
      });

      // 매출 합산 (날짜가 beforeDate 이전인 것만, 당일 제외)
      // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
      sales.forEach(sale => {
        const saleDate = dayjs(sale.transactionDate);
        if (saleDate.isBefore(endDate, 'day')) {
          const totalAmount = (Number(sale.totalAmount) || 0) + (Number(sale.vatAmount) || 0);
          balance += totalAmount; // 매출은 +
          console.log(`매출 추가: 날짜=${saleDate.format('YYYY-MM-DD')}, 공급가액=${sale.totalAmount}, 세액=${sale.vatAmount}, 합계=${totalAmount}, 누적잔액=${balance}`);
          if (!lastTransactionDate || saleDate.isAfter(dayjs(lastTransactionDate))) {
            lastTransactionDate = saleDate.format('YYYY-MM-DD');
          }
        }
      });

      // 매입 차감 (날짜가 beforeDate 이전인 것만, 당일 제외)
      // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
      purchases.forEach(purchase => {
        const purchaseDate = dayjs(purchase.transactionDate || purchase.purchaseDate);
        if (purchaseDate.isBefore(endDate, 'day')) {
          // 매입의 totalAmount는 이미 공급가액이고, vatAmount는 세액
          const totalAmount = (Number(purchase.totalAmount) || 0) + (Number(purchase.vatAmount) || 0);
          balance -= totalAmount; // 매입은 -
          console.log(`매입 차감: 날짜=${purchaseDate.format('YYYY-MM-DD')}, 공급가액=${purchase.totalAmount}, 세액=${purchase.vatAmount}, 합계=${totalAmount}, 누적잔액=${balance}`);
          if (!lastTransactionDate || purchaseDate.isAfter(dayjs(lastTransactionDate))) {
            lastTransactionDate = purchaseDate.format('YYYY-MM-DD');
          }
        }
      });

      // 수금/입금 처리 (날짜가 beforeDate 이전인 것만, 당일 제외)
      // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
      payments.forEach(payment => {
        const paymentDate = dayjs(payment.paymentDate);
        if (paymentDate.isBefore(endDate, 'day')) {
          // 수금과 입금 모두 거래처로부터 돈을 받는 것이므로 받을 돈(balance) 감소
          const paymentAmount = Number(payment.amount) || 0;
          if (payment.paymentType === '수금' || payment.paymentType === '입금') {
            balance -= paymentAmount;
            console.log(`${payment.paymentType} 차감: 날짜=${paymentDate.format('YYYY-MM-DD')}, 금액=${paymentAmount}, 누적잔액=${balance}`);
          }
          if (!lastTransactionDate || paymentDate.isAfter(dayjs(lastTransactionDate))) {
            lastTransactionDate = paymentDate.format('YYYY-MM-DD');
          }
        }
      });

      console.log(`===== 최종 잔액: ${balance} =====\n`);

      res.json({
        success: true,
        data: {
          customerId: Number(customerId),
          customerName: customer.name,
          balance: balance,
          lastTransactionDate: lastTransactionDate || dayjs().format('YYYY-MM-DD')
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