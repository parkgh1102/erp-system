"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const database_1 = require("../config/database");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Sales_1 = require("../entities/Sales");
const Purchase_1 = require("../entities/Purchase");
const Payment_1 = require("../entities/Payment");
const dayjs_1 = __importDefault(require("dayjs"));
class DashboardController {
    static async getStats(req, res) {
        try {
            const { businessId } = req.params;
            const { period = 'month', startDate, endDate } = req.query;
            // 기간 설정
            let queryStartDate;
            let queryEndDate;
            if (startDate && endDate) {
                queryStartDate = new Date(startDate);
                queryEndDate = new Date(endDate);
            }
            else {
                switch (period) {
                    case 'year':
                        queryStartDate = (0, dayjs_1.default)().startOf('year').toDate();
                        queryEndDate = (0, dayjs_1.default)().endOf('year').toDate();
                        break;
                    case 'week':
                        queryStartDate = (0, dayjs_1.default)().startOf('week').toDate();
                        queryEndDate = (0, dayjs_1.default)().endOf('week').toDate();
                        break;
                    default:
                        queryStartDate = (0, dayjs_1.default)().startOf('month').toDate();
                        queryEndDate = (0, dayjs_1.default)().endOf('month').toDate();
                }
            }
            // 데이터베이스 연결
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepo = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const customerRepo = database_1.AppDataSource.getRepository(Customer_1.Customer);
            const productRepo = database_1.AppDataSource.getRepository(Product_1.Product);
            const paymentRepo = database_1.AppDataSource.getRepository(Payment_1.Payment);
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
                customerRepo.count({ where: { businessId: parseInt(businessId), isActive: true } }),
                productRepo.count({ where: { businessId: parseInt(businessId), isActive: true } }),
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
            const prevStartDate = (0, dayjs_1.default)(queryStartDate).subtract(1, period).toDate();
            const prevEndDate = (0, dayjs_1.default)(queryEndDate).subtract(1, period).toDate();
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
                    start: (0, dayjs_1.default)(queryStartDate).format('YYYY-MM-DD'),
                    end: (0, dayjs_1.default)(queryEndDate).format('YYYY-MM-DD')
                }
            };
            res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({ success: false, message: '통계 조회에 실패했습니다.' });
        }
    }
    static async getRecentTransactions(req, res) {
        try {
            const { businessId } = req.params;
            const { limit = 5 } = req.query;
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepo = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            // 최근 매출 데이터 조회
            const recentSales = await salesRepo.find({
                where: { businessId: parseInt(businessId) },
                relations: ['customer'],
                order: { transactionDate: 'DESC', createdAt: 'DESC' },
                take: Math.ceil(limit / 2)
            });
            // 최근 매입 데이터 조회
            const recentPurchases = await purchaseRepo.find({
                where: { businessId: parseInt(businessId) },
                relations: ['customer'],
                order: { purchaseDate: 'DESC', createdAt: 'DESC' },
                take: Math.ceil(limit / 2)
            });
            // 매출 데이터 변환
            const salesTransactions = recentSales.map(sale => ({
                id: `sale-${sale.id}`,
                type: '매출',
                customer: sale.customer?.name || '미지정',
                amount: parseFloat(sale.totalAmount.toString()) + parseFloat(sale.vatAmount.toString()),
                date: (0, dayjs_1.default)(sale.transactionDate).format('YYYY-MM-DD'),
                status: '완료',
                description: sale.description || ''
            }));
            // 매입 데이터 변환
            const purchaseTransactions = recentPurchases.map(purchase => ({
                id: `purchase-${purchase.id}`,
                type: '매입',
                customer: purchase.customer?.name || '미지정',
                amount: parseFloat(purchase.totalAmount.toString()) + parseFloat(purchase.vatAmount.toString()),
                date: (0, dayjs_1.default)(purchase.purchaseDate).format('YYYY-MM-DD'),
                status: '완료',
                description: purchase.memo || ''
            }));
            // 두 배열 합치고 날짜순으로 정렬
            const allTransactions = [...salesTransactions, ...purchaseTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, limit);
            res.json({ success: true, data: allTransactions });
        }
        catch (error) {
            console.error('Recent transactions error:', error);
            res.status(500).json({ success: false, message: '최근 거래 조회에 실패했습니다.' });
        }
    }
    static async getSalesChart(req, res) {
        try {
            const { businessId } = req.params;
            const { period = 'month' } = req.query;
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepo = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            let months = 6; // 기본 6개월
            // Unused variables - commenting out
            // const dateFormat = 'YYYY-MM';
            // const labelFormat = 'MM월';
            if (period === 'year') {
                months = 12;
                // dateFormat = 'YYYY-MM';
                // labelFormat = 'MM월';
            }
            else if (period === 'week') {
                months = 8; // 8주
                // dateFormat = 'YYYY-WW';
                // labelFormat = 'WW주';
            }
            const endDate = (0, dayjs_1.default)().endOf('month');
            const startDate = (0, dayjs_1.default)().subtract(months - 1, 'month').startOf('month');
            // 매출 데이터 조회 (월별) - SQLite 버전
            const salesData = await salesRepo
                .createQueryBuilder('sales')
                .select([
                "strftime('%Y', sales.transactionDate) as year",
                "strftime('%m', sales.transactionDate) as month",
                'COALESCE(SUM(sales.totalAmount + sales.vatAmount), 0) as total'
            ])
                .where('sales.businessId = :businessId', { businessId })
                .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', {
                startDate: startDate.toDate(),
                endDate: endDate.toDate()
            })
                .groupBy("strftime('%Y', sales.transactionDate), strftime('%m', sales.transactionDate)")
                .orderBy('year, month')
                .getRawMany();
            // 매입 데이터 조회 (월별) - SQLite 버전
            const purchaseData = await purchaseRepo
                .createQueryBuilder('purchases')
                .select([
                "strftime('%Y', purchases.purchaseDate) as year",
                "strftime('%m', purchases.purchaseDate) as month",
                'COALESCE(SUM(purchases.totalAmount + purchases.vatAmount), 0) as total'
            ])
                .where('purchases.businessId = :businessId', { businessId })
                .andWhere('purchases.purchaseDate BETWEEN :startDate AND :endDate', {
                startDate: startDate.toDate(),
                endDate: endDate.toDate()
            })
                .groupBy("strftime('%Y', purchases.purchaseDate), strftime('%m', purchases.purchaseDate)")
                .orderBy('year, month')
                .getRawMany();
            // 모든 월에 대한 배열 생성
            const labels = [];
            const salesAmounts = [];
            const purchaseAmounts = [];
            for (let i = 0; i < months; i++) {
                const currentMonth = (0, dayjs_1.default)().subtract(months - 1 - i, 'month');
                const yearString = currentMonth.year().toString();
                const monthString = (currentMonth.month() + 1).toString().padStart(2, '0');
                labels.push(currentMonth.format('MM월'));
                // 매출 데이터 찾기 (SQLite는 문자열로 반환)
                const salesItem = salesData.find(item => item.year === yearString && item.month === monthString);
                salesAmounts.push(salesItem ? parseFloat(salesItem.total) : 0);
                // 매입 데이터 찾기 (SQLite는 문자열로 반환)
                const purchaseItem = purchaseData.find(item => item.year === yearString && item.month === monthString);
                purchaseAmounts.push(purchaseItem ? parseFloat(purchaseItem.total) : 0);
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
        }
        catch (error) {
            console.error('Sales chart error:', error);
            res.status(500).json({ success: false, message: '매출 차트 조회에 실패했습니다.' });
        }
    }
    static async getCategoryData(req, res) {
        try {
            const { businessId } = req.params;
            const { startDate, endDate } = req.query;
            // 날짜 필터링이 있으면 매출 기준으로 카테고리별 데이터 조회
            let categoryData = [];
            try {
                if (startDate && endDate) {
                    // 기간 내 매출 품목 기준 카테고리별 통계
                    categoryData = await database_1.AppDataSource.query(`
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
                }
                else {
                    // 기본: 제품 카테고리별 데이터
                    categoryData = await database_1.AppDataSource.query(`
            SELECT
              COALESCE(p.category, '기타') as category,
              COUNT(*) as count
            FROM products p
            WHERE p."businessId" = $1
            GROUP BY COALESCE(p.category, '기타')
            ORDER BY count DESC
          `, [businessId]);
                }
            }
            catch (error) {
                console.error('Category query error:', error);
                categoryData = [];
            }
            // 프론트엔드에서 기대하는 형식으로 변환: [{ name, amount }]
            const formattedData = categoryData.map((item) => ({
                name: item.category || '기타',
                amount: parseFloat(String(item.amount)) || parseInt(String(item.count)) || 0
            }));
            res.json({ success: true, data: formattedData });
        }
        catch (error) {
            console.error('Category data error:', error);
            res.status(500).json({ success: false, message: '카테고리 데이터 조회에 실패했습니다.' });
        }
    }
    static async getMonthlyTrend(req, res) {
        try {
            const { businessId } = req.params;
            // const { period: _period = 'month' } = req.query;
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
            // 현재 월의 일별 데이터 조회
            const currentMonth = (0, dayjs_1.default)();
            const startOfMonth = currentMonth.startOf('month').toDate();
            const endOfMonth = currentMonth.endOf('month').toDate();
            // 일별 매출 데이터 조회 - SQLite 버전
            const dailySales = await salesRepo
                .createQueryBuilder('sales')
                .select([
                "strftime('%d', sales.transactionDate) as day",
                'COALESCE(SUM(sales.totalAmount + sales.vatAmount), 0) as total'
            ])
                .where('sales.businessId = :businessId', { businessId })
                .andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', {
                startDate: startOfMonth,
                endDate: endOfMonth
            })
                .groupBy("strftime('%d', sales.transactionDate)")
                .orderBy('day')
                .getRawMany();
            // 현재 월의 총 일수
            const daysInMonth = currentMonth.daysInMonth();
            const labels = [];
            const data = [];
            // 모든 일에 대해 데이터 생성
            for (let day = 1; day <= daysInMonth; day++) {
                labels.push(`${day}일`);
                // 해당 일의 매출 데이터 찾기 (SQLite는 문자열로 반환)
                const salesItem = dailySales.find(item => parseInt(item.day) === day);
                data.push(salesItem ? parseFloat(salesItem.total) : 0);
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
        }
        catch (error) {
            console.error('Monthly trend error:', error);
            res.status(500).json({ success: false, message: '월별 추이 조회에 실패했습니다.' });
        }
    }
    static async getAllTransactions(req, res) {
        try {
            const { businessId } = req.params;
            const { startDate, endDate, search } = req.query;
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepo = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
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
                salesQuery = salesQuery.andWhere('(customer.name LIKE :search OR CAST(sales.totalAmount AS TEXT) LIKE :search)', { search: `%${search}%` });
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
                purchaseQuery = purchaseQuery.andWhere('(customer.name LIKE :search OR CAST(purchase.totalAmount AS TEXT) LIKE :search)', { search: `%${search}%` });
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
        }
        catch (error) {
            console.error('Get all transactions error:', error);
            res.status(500).json({ success: false, message: '전체 거래 내역 조회에 실패했습니다.' });
        }
    }
    // 매출 기준 상위 거래처 조회
    static async getTopCustomers(req, res) {
        try {
            const { businessId } = req.params;
            const { startDate, endDate, limit = 10 } = req.query;
            const salesRepo = database_1.AppDataSource.getRepository(Sales_1.Sales);
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
                queryBuilder = queryBuilder.andWhere('sales.transactionDate BETWEEN :startDate AND :endDate', { startDate, endDate });
            }
            const topCustomers = await queryBuilder
                .groupBy('customer.id')
                .addGroupBy('customer.name')
                .addGroupBy('customer.businessNumber')
                .orderBy('totalAmount', 'DESC')
                .limit(parseInt(limit))
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
        }
        catch (error) {
            console.error('Get top customers error:', error);
            res.status(500).json({ success: false, message: '상위 거래처 조회에 실패했습니다.' });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map