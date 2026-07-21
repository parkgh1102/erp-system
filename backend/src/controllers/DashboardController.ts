import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { Sales } from '../entities/Sales';
import { Purchase } from '../entities/Purchase';
import { Payment } from '../entities/Payment';
import dayjs from 'dayjs';

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { period = 'month', startDate, endDate } = req.query;

      // 기간 설정
      let queryStartDate: Date;
      let queryEndDate: Date;

      if (startDate && endDate) {
        queryStartDate = new Date(startDate as string);
        queryEndDate = new Date(endDate as string);
      } else {
        switch (period) {
          case 'year':
            queryStartDate = dayjs().startOf('year').toDate();
            queryEndDate = dayjs().endOf('year').toDate();
            break;
          case 'week':
            queryStartDate = dayjs().startOf('week').toDate();
            queryEndDate = dayjs().endOf('week').toDate();
            break;
          default:
            queryStartDate = dayjs().startOf('month').toDate();
            queryEndDate = dayjs().endOf('month').toDate();
        }
      }

      // 데이터베이스 연결
      const salesRepo = AppDataSource.getRepository(Sales);
      const purchaseRepo = AppDataSource.getRepository(Purchase);
      const customerRepo = AppDataSource.getRepository(Customer);
      const productRepo = AppDataSource.getRepository(Product);
      const paymentRepo = AppDataSource.getRepository(Payment);

      // 현재 기간 통계
      const [totalSalesResult, totalPurchasesResult, totalCustomers, totalProducts, totalReceiptsResult, totalPaymentsResult] = await Promise.all([
        salesRepo
          .createQueryBuilder('sales')
          .where('sales.businessId = :businessId', { businessId })
          .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', { startDate: queryStartDate, endDate: queryEndDate })
          .select('COALESCE(SUM(sales.totalAmount + sales.vatAmount), 0)', 'total')
          .getRawOne(),

        purchaseRepo
          .createQueryBuilder('purchases')
          .where('purchases.businessId = :businessId', { businessId })
          .andWhere('purchases.purchaseDate BETWEEN :startDate AND :endDate', { startDate: queryStartDate, endDate: queryEndDate })
          .select('COALESCE(SUM(purchases.totalAmount + purchases.vatAmount), 0)', 'total')
          .getRawOne(),

        customerRepo.count({ where: { businessId: parseInt(businessId as string), isActive: true } }),
        productRepo.count({ where: { businessId: parseInt(businessId as string), isActive: true } }),

        // 수금 합계 (paymentType = '수금')
        paymentRepo
          .createQueryBuilder('payment')
          .where('payment.businessId = :businessId', { businessId })
          .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate: queryStartDate, endDate: queryEndDate })
          .andWhere('payment.paymentType = :type', { type: '수금' })
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .getRawOne(),

        // 지급 합계 (paymentType = '지급')
        paymentRepo
          .createQueryBuilder('payment')
          .where('payment.businessId = :businessId', { businessId })
          .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate: queryStartDate, endDate: queryEndDate })
          .andWhere('payment.paymentType = :type', { type: '지급' })
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .getRawOne()
      ]);

      // 이전 기간과 비교를 위한 날짜 계산
      // 커스텀 기간에도 정확하도록 실제 조회 기간 길이만큼 직전 구간과 비교
      // (기존: period(기본 month)로 고정 감산 → 커스텀 범위에서 비교 구간이 어긋남)
      const rangeDays = dayjs(queryEndDate).diff(dayjs(queryStartDate), 'day');
      const prevEndDate = dayjs(queryStartDate).subtract(1, 'day').toDate();
      const prevStartDate = dayjs(queryStartDate).subtract(rangeDays + 1, 'day').toDate();

      const [prevSalesResult, prevPurchasesResult] = await Promise.all([
        salesRepo
          .createQueryBuilder('sales')
          .where('sales.businessId = :businessId', { businessId })
          .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', { startDate: prevStartDate, endDate: prevEndDate })
          .select('COALESCE(SUM(sales.totalAmount + sales.vatAmount), 0)', 'total')
          .getRawOne(),

        purchaseRepo
          .createQueryBuilder('purchases')
          .where('purchases.businessId = :businessId', { businessId })
          .andWhere('purchases.purchaseDate BETWEEN :startDate AND :endDate', { startDate: prevStartDate, endDate: prevEndDate })
          .select('COALESCE(SUM(purchases.totalAmount + purchases.vatAmount), 0)', 'total')
          .getRawOne()
      ]);

      const currentSales = parseFloat(totalSalesResult.total) || 0;
      const currentPurchases = parseFloat(totalPurchasesResult.total) || 0;
      const currentReceipts = parseFloat(totalReceiptsResult.total) || 0;
      const currentPayments = parseFloat(totalPaymentsResult.total) || 0;
      const prevSales = parseFloat(prevSalesResult.total) || 0;
      const prevPurchases = parseFloat(prevPurchasesResult.total) || 0;

      // 성장률 계산
      const salesGrowth = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100) : 0;
      const purchaseGrowth = prevPurchases > 0 ? ((currentPurchases - prevPurchases) / prevPurchases * 100) : 0;

      const stats = {
        totalSales: currentSales,
        totalPurchases: currentPurchases,
        totalReceipts: currentReceipts,
        totalPayments: currentPayments,
        totalCustomers,
        totalProducts,
        customerCount: totalCustomers,
        productCount: totalProducts,
        salesGrowth: Number(salesGrowth.toFixed(1)),
        purchaseGrowth: Number(purchaseGrowth.toFixed(1)),
        netProfit: currentSales - currentPurchases,
        period: {
          start: dayjs(queryStartDate).format('YYYY-MM-DD'),
          end: dayjs(queryEndDate).format('YYYY-MM-DD')
        }
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ success: false, message: '통계 조회에 실패했습니다.' });
    }
  }

  static async getRecentTransactions(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { limit = 5 } = req.query;

      const salesRepo = AppDataSource.getRepository(Sales);
      const purchaseRepo = AppDataSource.getRepository(Purchase);

      // 최근 매출 데이터 조회
      const recentSales = await salesRepo.find({
        where: { businessId: parseInt(businessId as string) },
        relations: ['customer'],
        order: { transactionDate: 'DESC', createdAt: 'DESC' },
        take: Math.ceil((limit as number) / 2)
      });

      // 최근 매입 데이터 조회
      const recentPurchases = await purchaseRepo.find({
        where: { businessId: parseInt(businessId as string) },
        relations: ['customer'],
        order: { purchaseDate: 'DESC', createdAt: 'DESC' },
        take: Math.ceil((limit as number) / 2)
      });

      // 매출 데이터 변환
      const salesTransactions = recentSales.map(sale => ({
        id: `sale-${sale.id}`,
        type: '매출',
        customer: sale.customer?.name || '미지정',
        amount: parseFloat(sale.totalAmount.toString()) + parseFloat(sale.vatAmount.toString()),
        date: dayjs(sale.transactionDate).format('YYYY-MM-DD'),
        status: '완료',
        description: sale.description || ''
      }));

      // 매입 데이터 변환
      const purchaseTransactions = recentPurchases.map(purchase => ({
        id: `purchase-${purchase.id}`,
        type: '매입',
        customer: purchase.customer?.name || '미지정',
        amount: parseFloat(purchase.totalAmount.toString()) + parseFloat(purchase.vatAmount.toString()),
        date: dayjs(purchase.purchaseDate).format('YYYY-MM-DD'),
        status: '완료',
        description: purchase.memo || ''
      }));

      // 두 배열 합치고 날짜순으로 정렬
      const allTransactions = [...salesTransactions, ...purchaseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit as number);

      res.json({ success: true, data: allTransactions });
    } catch (error) {
      console.error('Recent transactions error:', error);
      res.status(500).json({ success: false, message: '최근 거래 조회에 실패했습니다.' });
    }
  }

  static async getSalesChart(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { period = 'month' } = req.query;

      const salesRepo = AppDataSource.getRepository(Sales);
      const purchaseRepo = AppDataSource.getRepository(Purchase);

      let months = 6; // 기본 6개월

      if (period === 'year') {
        months = 12;
      } else if (period === 'week') {
        months = 8; // 8주
      }

      const endDate = dayjs().endOf('month');
      const startDate = dayjs().subtract(months - 1, 'month').startOf('month');

      // 월별 집계는 DB 날짜함수(strftime 등) 대신 JS에서 수행 —
      // strftime은 SQLite 전용이라 운영 PostgreSQL에서 쿼리가 실패했음.
      const salesRows = await salesRepo
        .createQueryBuilder('sales')
        .select(['sales.transactionDate AS date', 'sales.totalAmount AS amount', 'sales.vatAmount AS vat'])
        .where('sales.businessId = :businessId', { businessId })
        .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', {
          startDate: startDate.toDate(),
          endDate: endDate.toDate()
        })
        .getRawMany();

      const purchaseRows = await purchaseRepo
        .createQueryBuilder('purchases')
        .select(['purchases.purchaseDate AS date', 'purchases.totalAmount AS amount', 'purchases.vatAmount AS vat'])
        .where('purchases.businessId = :businessId', { businessId })
        .andWhere('purchases.purchaseDate BETWEEN :startDate AND :endDate', {
          startDate: startDate.toDate(),
          endDate: endDate.toDate()
        })
        .getRawMany();

      // 'YYYY-MM' 키로 합계 집계 (DB가 Date/문자열 어느 쪽을 주든 dayjs가 처리)
      const bucketByMonth = (rows: any[]) => {
        const map = new Map<string, number>();
        for (const row of rows) {
          const key = dayjs(row.date).format('YYYY-MM');
          const value = Number(row.amount || 0) + Number(row.vat || 0);
          map.set(key, (map.get(key) || 0) + value);
        }
        return map;
      };
      const salesByMonth = bucketByMonth(salesRows);
      const purchaseByMonth = bucketByMonth(purchaseRows);

      // 모든 월에 대한 배열 생성
      const labels: string[] = [];
      const salesAmounts: number[] = [];
      const purchaseAmounts: number[] = [];

      for (let i = 0; i < months; i++) {
        const currentMonth = dayjs().subtract(months - 1 - i, 'month');
        const key = currentMonth.format('YYYY-MM');

        // 12개월 조회 시 'MM월'만 쓰면 라벨이 중복되므로 해가 바뀌면 연도 표기
        labels.push(months > 12 || currentMonth.year() !== dayjs().year()
          ? currentMonth.format('YY년 MM월')
          : currentMonth.format('MM월'));

        salesAmounts.push(salesByMonth.get(key) || 0);
        purchaseAmounts.push(purchaseByMonth.get(key) || 0);
      }

      const chartData = {
        labels,
        datasets: [
          {
            label: '매출',
            data: salesAmounts,
            backgroundColor: 'rgba(24, 144, 255, 0.6)',
            borderColor: 'rgba(24, 144, 255, 1)',
            borderWidth: 2,
          },
          {
            label: '매입',
            data: purchaseAmounts,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
          },
        ],
      };

      res.json({ success: true, data: chartData });
    } catch (error) {
      console.error('Sales chart error:', error);
      res.status(500).json({ success: false, message: '매출 차트 조회에 실패했습니다.' });
    }
  }

  static async getCategoryData(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { startDate, endDate } = req.query;

      // 날짜 필터링이 있으면 매출 기준으로 카테고리별 데이터 조회
      let categoryData = [];
      try {
        if (startDate && endDate) {
          // 기간 내 매출 품목 기준 카테고리별 통계
          categoryData = await AppDataSource.query(`
            SELECT
              COALESCE(p.category, '기타') as category,
              COUNT(*) as count,
              SUM(COALESCE(si."supplyAmount", si.amount, 0)) as amount
            FROM sales_items si
            LEFT JOIN products p ON si."productId" = p.id
            LEFT JOIN sales s ON si."salesId" = s.id
            WHERE s."businessId" = $1
              AND s."transactionDate" >= $2
              AND s."transactionDate" <= $3
            GROUP BY COALESCE(p.category, '기타')
            ORDER BY amount DESC
          `, [businessId, startDate, endDate]);
        } else {
          // 기본: 제품 카테고리별 데이터
          categoryData = await AppDataSource.query(`
            SELECT
              COALESCE(p.category, '기타') as category,
              COUNT(*) as count
            FROM products p
            WHERE p."businessId" = $1
            GROUP BY COALESCE(p.category, '기타')
            ORDER BY count DESC
          `, [businessId]);
        }
      } catch (error) {
        console.error('Category query error:', error);
        categoryData = [];
      }

      // 프론트엔드에서 기대하는 형식으로 변환: [{ name, amount }]
      const formattedData = categoryData.map((item: { category?: string; amount?: string | number; count?: string | number }) => ({
        name: item.category || '기타',
        amount: parseFloat(String(item.amount)) || parseInt(String(item.count)) || 0
      }));

      res.json({ success: true, data: formattedData });
    } catch (error) {
      console.error('Category data error:', error);
      res.status(500).json({ success: false, message: '카테고리 데이터 조회에 실패했습니다.' });
    }
  }

  static async getMonthlyTrend(req: Request, res: Response) {
    try {
      const { businessId } = req.params;

      const salesRepo = AppDataSource.getRepository(Sales);

      // 현재 월의 일별 데이터 조회
      const currentMonth = dayjs();
      const startOfMonth = currentMonth.startOf('month').toDate();
      const endOfMonth = currentMonth.endOf('month').toDate();

      // 일별 집계도 JS에서 수행 (strftime은 SQLite 전용이라 PostgreSQL에서 실패)
      const dailyRows = await salesRepo
        .createQueryBuilder('sales')
        .select(['sales.transactionDate AS date', 'sales.totalAmount AS amount', 'sales.vatAmount AS vat'])
        .where('sales.businessId = :businessId', { businessId })
        .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', {
          startDate: startOfMonth,
          endDate: endOfMonth
        })
        .getRawMany();

      const salesByDay = new Map<number, number>();
      for (const row of dailyRows) {
        const day = dayjs(row.date).date();
        const value = Number(row.amount || 0) + Number(row.vat || 0);
        salesByDay.set(day, (salesByDay.get(day) || 0) + value);
      }

      // 현재 월의 총 일수
      const daysInMonth = currentMonth.daysInMonth();
      const labels: string[] = [];
      const data: number[] = [];

      // 모든 일에 대해 데이터 생성
      for (let day = 1; day <= daysInMonth; day++) {
        labels.push(`${day}일`);
        data.push(salesByDay.get(day) || 0);
      }

      const trendData = {
        labels,
        datasets: [
          {
            label: '일별 매출',
            data,
            borderColor: 'rgba(24, 144, 255, 1)',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };

      res.json({ success: true, data: trendData });
    } catch (error) {
      console.error('Monthly trend error:', error);
      res.status(500).json({ success: false, message: '월별 추이 조회에 실패했습니다.' });
    }
  }

  static async getAllTransactions(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { startDate, endDate, search } = req.query;

      const salesRepo = AppDataSource.getRepository(Sales);
      const purchaseRepo = AppDataSource.getRepository(Purchase);

      // 매출 데이터 조회
      let salesQuery = salesRepo
        .createQueryBuilder('sales')
        .leftJoinAndSelect('sales.customer', 'customer')
        .where('sales.businessId = :businessId', { businessId });

      if (startDate && endDate) {
        salesQuery = salesQuery.andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      if (search) {
        salesQuery = salesQuery.andWhere(
          '(LOWER(customer.name) LIKE LOWER(:search) OR CAST(sales.totalAmount AS TEXT) LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const salesData = await salesQuery.getMany();

      // 매입 데이터 조회
      let purchaseQuery = purchaseRepo
        .createQueryBuilder('purchase')
        .leftJoinAndSelect('purchase.customer', 'customer')
        .where('purchase.businessId = :businessId', { businessId });

      if (startDate && endDate) {
        purchaseQuery = purchaseQuery.andWhere('purchase.purchaseDate BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        });
      }

      if (search) {
        purchaseQuery = purchaseQuery.andWhere(
          '(LOWER(customer.name) LIKE LOWER(:search) OR CAST(purchase.totalAmount AS TEXT) LIKE :search)',
          { search: `%${search}%` }
        );
      }

      const purchaseData = await purchaseQuery.getMany();

      // 데이터 변환
      const transactions = [
        ...salesData.map(sale => ({
          id: `sale-${sale.id}`,
          type: '매출',
          customer: sale.customer?.name || '알 수 없음',
          amount: (parseFloat(sale.totalAmount.toString()) || 0) + (parseFloat(sale.vatAmount.toString()) || 0),
          date: sale.transactionDate,
          status: '완료'
        })),
        ...purchaseData.map(purchase => ({
          id: `purchase-${purchase.id}`,
          type: '매입',
          customer: purchase.customer?.name || '알 수 없음',
          amount: (parseFloat(purchase.totalAmount.toString()) || 0) + (parseFloat(purchase.vatAmount.toString()) || 0),
          date: purchase.purchaseDate,
          status: '완료'
        }))
      ];

      // 날짜순 정렬 (최신순)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      res.json({ success: true, data: transactions });
    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({ success: false, message: '전체 거래 내역 조회에 실패했습니다.' });
    }
  }

  // 매출 기준 상위 거래처 조회
  static async getTopCustomers(req: Request, res: Response) {
    try {
      const { businessId } = req.params;
      const { startDate, endDate, limit = 10 } = req.query;

      const salesRepo = AppDataSource.getRepository(Sales);

      // 거래처별 매출 합계 쿼리
      let queryBuilder = salesRepo
        .createQueryBuilder('sales')
        .leftJoin('sales.customer', 'customer')
        .select('customer.id', 'id')
        .addSelect('customer.name', 'name')
        .addSelect('customer.businessNumber', 'businessNumber')
        .addSelect('SUM(sales.totalAmount + sales.vatAmount)', 'totalAmount')
        .addSelect('COUNT(sales.id)', 'transactionCount')
        .where('sales.businessId = :businessId', { businessId })
        .andWhere('customer.id IS NOT NULL');

      if (startDate && endDate) {
        queryBuilder = queryBuilder.andWhere(
          'sales.transactionDate BETWEEN :startDate AND :endDate',
          { startDate, endDate }
        );
      }

      const topCustomers = await queryBuilder
        .groupBy('customer.id')
        .addGroupBy('customer.name')
        .addGroupBy('customer.businessNumber')
        .orderBy('totalAmount', 'DESC')
        .limit(parseInt(limit as string))
        .getRawMany();

      // 숫자 타입 변환
      const formattedCustomers = topCustomers.map(c => ({
        id: c.id,
        name: c.name,
        businessNumber: c.businessNumber,
        totalAmount: parseFloat(c.totalAmount) || 0,
        transactionCount: parseInt(c.transactionCount) || 0
      }));

      res.json({ success: true, data: formattedCustomers });
    } catch (error) {
      console.error('Get top customers error:', error);
      res.status(500).json({ success: false, message: '상위 거래처 조회에 실패했습니다.' });
    }
  }
}