"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionLedgerController = void 0;
const database_1 = require("../config/database");
const Customer_1 = require("../entities/Customer");
const Sales_1 = require("../entities/Sales");
const Purchase_1 = require("../entities/Purchase");
const Payment_1 = require("../entities/Payment");
const dayjs_1 = __importDefault(require("dayjs"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
dayjs_1.default.extend(isSameOrAfter_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
exports.transactionLedgerController = {
    // 거래원장 조회
    async getLedger(req, res) {
        try {
            const { businessId } = req.params;
            const { customerId, startDate, endDate } = req.query;
            const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
            const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
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
            const start = startDate ? (0, dayjs_1.default)(startDate) : (0, dayjs_1.default)().startOf('month');
            const end = endDate ? (0, dayjs_1.default)(endDate) : (0, dayjs_1.default)().endOf('month');
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
                const saleDate = (0, dayjs_1.default)(sale.transactionDate);
                if (saleDate.isBefore(start, 'day')) {
                    const totalAmount = (Number(sale.totalAmount) || 0) + (Number(sale.vatAmount) || 0);
                    previousBalance += totalAmount;
                }
            });
            allPurchasesForBalance.forEach(purchase => {
                const purchaseDate = (0, dayjs_1.default)(purchase.purchaseDate);
                if (purchaseDate.isBefore(start, 'day')) {
                    const totalAmount = (Number(purchase.totalAmount) || 0) + (Number(purchase.vatAmount) || 0);
                    previousBalance -= totalAmount;
                }
            });
            allPaymentsForBalance.forEach(payment => {
                const paymentDate = (0, dayjs_1.default)(payment.paymentDate);
                if (paymentDate.isBefore(start, 'day')) {
                    const paymentAmount = Number(payment.amount) || 0;
                    if (payment.paymentType === '수금') {
                        previousBalance -= paymentAmount;
                    }
                    else if (payment.paymentType === '지급') {
                        previousBalance += paymentAmount;
                    }
                }
            });
            // 매출 데이터 조회 (날짜 범위 포함) - items.product 포함하여 taxType 확인
            const allSales = await salesRepository.find({
                where: {
                    customerId: Number(customerId),
                    businessId: Number(businessId),
                },
                relations: ['customer', 'items', 'items.product']
            });
            // 날짜 범위 필터링
            const sales = allSales.filter(sale => {
                const saleDate = (0, dayjs_1.default)(sale.transactionDate);
                return saleDate.isSameOrAfter(start, 'day') && saleDate.isSameOrBefore(end, 'day');
            });
            // 매입 데이터 조회 (날짜 범위 포함) - items.product 포함하여 taxType 확인
            const allPurchases = await purchaseRepository.find({
                where: {
                    customerId: Number(customerId),
                    businessId: Number(businessId),
                },
                relations: ['customer', 'items', 'items.product']
            });
            // 날짜 범위 필터링
            const purchases = allPurchases.filter(purchase => {
                const purchaseDate = (0, dayjs_1.default)(purchase.purchaseDate);
                return purchaseDate.isSameOrAfter(start, 'day') && purchaseDate.isSameOrBefore(end, 'day');
            });
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
                const paymentDate = (0, dayjs_1.default)(payment.paymentDate);
                return paymentDate.isSameOrAfter(start, 'day') && paymentDate.isSameOrBefore(end, 'day');
            });
            // 거래원장 엔트리 생성
            const entries = [];
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
                // 전체 품목 배열 생성 (세액, 합계 포함) - product.taxType 기반 세액 계산
                const allItems = sale.items?.map(item => {
                    const itemSupplyAmount = Number(item.supplyAmount) || 0;
                    // product의 taxType 확인하여 세액 계산
                    const taxType = item.product?.taxType || 'tax_separate';
                    let itemTaxAmount = 0;
                    if (taxType === 'tax_free') {
                        // 면세: 세액 0
                        itemTaxAmount = 0;
                    }
                    else if (taxType === 'tax_inclusive') {
                        // 과세10%포함: 저장된 taxAmount 사용 (이미 분리 계산됨)
                        itemTaxAmount = Number(item.taxAmount) || 0;
                    }
                    else {
                        // 과세10%별도: 저장된 taxAmount 사용
                        itemTaxAmount = Number(item.taxAmount) || 0;
                    }
                    return {
                        itemCode: item.productId?.toString() || '',
                        itemName: item.itemName || '',
                        spec: item.specification || '',
                        quantity: Number(item.quantity) || 0,
                        unitPrice: Number(item.unitPrice) || 0,
                        amount: itemSupplyAmount,
                        taxAmount: itemTaxAmount,
                        totalAmount: itemSupplyAmount + itemTaxAmount
                    };
                }) || [];
                entries.push({
                    id: sale.id,
                    date: (0, dayjs_1.default)(sale.transactionDate).format('YYYY-MM-DD'),
                    type: 'sales',
                    description: '매출',
                    customerName: customer.name,
                    amount: supplyAmount,
                    supplyAmount: supplyAmount, // Sale의 totalAmount가 공급가액
                    vatAmount: vatAmount, // Sale의 vatAmount
                    totalAmount: totalAmount, // 공급가액 + 세액
                    balance: runningBalance,
                    memo: sale.memo || sale.description || '',
                    itemCount: itemCount, // 품목 개수 추가
                    items: allItems, // 전체 품목 배열
                    itemInfo: allItems[0] || undefined
                });
            });
            // 매입 항목 추가
            purchases.forEach((purchase) => {
                // Purchase의 totalAmount는 공급가액, vatAmount는 세액
                // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
                const supplyAmount = Number(purchase.totalAmount) || 0; // 공급가액
                const vatAmount = Number(purchase.vatAmount) || 0; // 세액
                const totalAmount = supplyAmount + vatAmount; // 합계 (공급가액 + 세액)
                runningBalance -= totalAmount;
                // 품목 개수 계산
                const itemCount = purchase.items?.length || 0;
                // 전체 품목 배열 생성 (세액, 합계 포함) - product.taxType 기반 세액 계산
                const totalPurchaseVat = Number(purchase.vatAmount) || 0;
                const allPurchaseItems = purchase.items?.map(item => {
                    const itemSupplyAmount = Number(item.amount) || 0;
                    // product의 taxType 확인하여 세액 계산
                    const taxType = item.product?.taxType || 'tax_separate';
                    let itemTaxAmount = 0;
                    if (taxType === 'tax_free') {
                        // 면세: 세액 0
                        itemTaxAmount = 0;
                    }
                    else if (supplyAmount > 0) {
                        // 과세: 전체 세액을 품목별 공급가액 비율로 배분
                        itemTaxAmount = Math.round(totalPurchaseVat * (itemSupplyAmount / supplyAmount));
                    }
                    return {
                        itemCode: item.productId?.toString() || '',
                        itemName: item.productName || '',
                        spec: item.spec || '',
                        quantity: Number(item.quantity) || 0,
                        unitPrice: Number(item.unitPrice) || 0,
                        amount: itemSupplyAmount,
                        taxAmount: itemTaxAmount,
                        totalAmount: itemSupplyAmount + itemTaxAmount
                    };
                }) || [];
                entries.push({
                    id: purchase.id + 10000,
                    date: (0, dayjs_1.default)(purchase.purchaseDate).format('YYYY-MM-DD'),
                    type: 'purchase',
                    description: '매입',
                    customerName: customer.name,
                    amount: supplyAmount,
                    supplyAmount: supplyAmount,
                    vatAmount: vatAmount,
                    totalAmount: totalAmount,
                    balance: runningBalance,
                    memo: purchase.memo || '',
                    itemCount: itemCount, // 품목 개수 추가
                    items: allPurchaseItems, // 전체 품목 배열
                    itemInfo: allPurchaseItems[0] || undefined
                });
            });
            // 수금/지급 항목 추가
            payments.forEach((payment) => {
                // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
                const paymentAmount = Number(payment.amount) || 0;
                // 수금: 거래처로부터 돈을 받음 (받을 돈 감소)
                // 지급: 거래처에 돈을 지급 (갚을 돈 감소 = 잔액 증가)
                const isReceipt = payment.paymentType === '수금';
                const isPayment = payment.paymentType === '지급';
                if (isReceipt) {
                    runningBalance -= paymentAmount;
                }
                else if (isPayment) {
                    runningBalance += paymentAmount;
                }
                entries.push({
                    id: payment.id + 20000,
                    date: (0, dayjs_1.default)(payment.paymentDate).format('YYYY-MM-DD'),
                    type: isReceipt ? 'receipt' : 'payment',
                    description: isReceipt ? '수금' : '출금', // 지급은 '출금'으로 표시
                    customerName: customer.name,
                    amount: paymentAmount,
                    supplyAmount: paymentAmount, // 수금/지급은 세액 없이 전체 금액
                    vatAmount: 0,
                    totalAmount: paymentAmount,
                    balance: runningBalance,
                    memo: payment.memo || ''
                });
            });
            // 날짜순 정렬
            entries.sort((a, b) => (0, dayjs_1.default)(a.date).valueOf() - (0, dayjs_1.default)(b.date).valueOf());
            // 정렬 후 잔액 재계산 (runningBalance) - 전잔금 포함
            let recalculatedBalance = previousBalance; // 전잔금부터 시작
            entries.forEach(entry => {
                if (entry.type === 'sales') {
                    recalculatedBalance += entry.totalAmount;
                }
                else if (entry.type === 'purchase') {
                    recalculatedBalance -= entry.totalAmount;
                }
                else if (entry.type === 'receipt') {
                    recalculatedBalance -= entry.totalAmount;
                }
                else if (entry.type === 'payment') {
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
            const ledgerData = {
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
        }
        catch (error) {
            console.error('거래원장 조회 오류:', error.message);
            res.status(500).json({
                success: false,
                message: '거래원장 조회 중 오류가 발생했습니다.',
                error: error.message
            });
        }
    },
    // 거래원장 상세 내역 조회
    async getLedgerDetails(req, res) {
        try {
            const { businessId } = req.params;
            const { customerId, startDate, endDate, type } = req.query;
            const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
            // 날짜 범위 설정
            const start = startDate ? (0, dayjs_1.default)(startDate) : (0, dayjs_1.default)().startOf('month');
            const end = endDate ? (0, dayjs_1.default)(endDate) : (0, dayjs_1.default)().endOf('month');
            const details = [];
            // 매출 데이터 조회
            if (!type || type === 'sales') {
                const salesQuery = salesRepository.createQueryBuilder('sales')
                    .leftJoinAndSelect('sales.customer', 'customer')
                    .where('sales.businessId = :businessId', { businessId: Number(businessId) })
                    .andWhere('sales.transactionDate >= :start', { start: start.format('YYYY-MM-DD') })
                    .andWhere('sales.transactionDate <= :end', { end: end.format('YYYY-MM-DD') });
                if (customerId) {
                    salesQuery.andWhere('sales.customerId = :customerId', { customerId: Number(customerId) });
                }
                const sales = await salesQuery.getMany();
                sales.forEach(sale => {
                    const supplyAmount = Number(sale.totalAmount) || 0;
                    const vatAmount = Number(sale.vatAmount) || 0;
                    details.push({
                        id: sale.id,
                        date: (0, dayjs_1.default)(sale.transactionDate).format('YYYY-MM-DD'),
                        type: 'sales',
                        description: sale.description || '매출',
                        customerName: sale.customer?.name || '',
                        amount: supplyAmount + vatAmount,
                        supplyAmount,
                        vatAmount,
                        memo: sale.memo || undefined
                    });
                });
            }
            // 매입 데이터 조회
            if (!type || type === 'purchase') {
                const purchaseQuery = purchaseRepository.createQueryBuilder('purchase')
                    .leftJoinAndSelect('purchase.customer', 'customer')
                    .where('purchase.businessId = :businessId', { businessId: Number(businessId) })
                    .andWhere('purchase.purchaseDate >= :start', { start: start.format('YYYY-MM-DD') })
                    .andWhere('purchase.purchaseDate <= :end', { end: end.format('YYYY-MM-DD') });
                if (customerId) {
                    purchaseQuery.andWhere('purchase.customerId = :customerId', { customerId: Number(customerId) });
                }
                const purchases = await purchaseQuery.getMany();
                purchases.forEach(purchase => {
                    const supplyAmount = Number(purchase.totalAmount) || 0;
                    const vatAmount = Number(purchase.vatAmount) || 0;
                    details.push({
                        id: purchase.id,
                        date: (0, dayjs_1.default)(purchase.purchaseDate).format('YYYY-MM-DD'),
                        type: 'purchase',
                        description: purchase.memo || '매입',
                        customerName: purchase.customer?.name || '',
                        amount: supplyAmount + vatAmount,
                        supplyAmount,
                        vatAmount
                    });
                });
            }
            // 수금/지급 데이터 조회
            if (!type || type === 'receipt' || type === 'payment') {
                const paymentQuery = paymentRepository.createQueryBuilder('payment')
                    .leftJoinAndSelect('payment.customer', 'customer')
                    .where('payment.businessId = :businessId', { businessId: Number(businessId) })
                    .andWhere('payment.paymentDate >= :start', { start: start.format('YYYY-MM-DD') })
                    .andWhere('payment.paymentDate <= :end', { end: end.format('YYYY-MM-DD') });
                if (customerId) {
                    paymentQuery.andWhere('payment.customerId = :customerId', { customerId: Number(customerId) });
                }
                if (type === 'receipt') {
                    paymentQuery.andWhere('payment.paymentType = :paymentType', { paymentType: '수금' });
                }
                else if (type === 'payment') {
                    paymentQuery.andWhere('payment.paymentType = :paymentType', { paymentType: '지급' });
                }
                const payments = await paymentQuery.getMany();
                payments.forEach(payment => {
                    const amount = Number(payment.amount) || 0;
                    details.push({
                        id: payment.id,
                        date: (0, dayjs_1.default)(payment.paymentDate).format('YYYY-MM-DD'),
                        type: payment.paymentType === '수금' ? 'receipt' : 'payment',
                        description: payment.paymentType,
                        customerName: payment.customer?.name || '',
                        amount,
                        supplyAmount: amount,
                        vatAmount: 0,
                        memo: payment.memo || undefined
                    });
                });
            }
            // 날짜순 정렬
            details.sort((a, b) => (0, dayjs_1.default)(a.date).valueOf() - (0, dayjs_1.default)(b.date).valueOf());
            res.json({
                success: true,
                data: details
            });
        }
        catch (error) {
            console.error('거래원장 상세 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '거래원장 상세 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 거래원장 요약 정보 조회
    async getLedgerSummary(req, res) {
        try {
            const { businessId } = req.params;
            const { customerId, startDate, endDate } = req.query;
            const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
            // 날짜 범위 설정
            const start = startDate ? (0, dayjs_1.default)(startDate) : (0, dayjs_1.default)().startOf('month');
            const end = endDate ? (0, dayjs_1.default)(endDate) : (0, dayjs_1.default)().endOf('month');
            // 매출 합계
            const salesQuery = salesRepository.createQueryBuilder('sales')
                .select('COALESCE(SUM(sales.totalAmount), 0)', 'totalSupply')
                .addSelect('COALESCE(SUM(sales.vatAmount), 0)', 'totalVat')
                .addSelect('COUNT(sales.id)', 'count')
                .where('sales.businessId = :businessId', { businessId: Number(businessId) })
                .andWhere('sales.transactionDate >= :start', { start: start.format('YYYY-MM-DD') })
                .andWhere('sales.transactionDate <= :end', { end: end.format('YYYY-MM-DD') });
            if (customerId) {
                salesQuery.andWhere('sales.customerId = :customerId', { customerId: Number(customerId) });
            }
            const salesResult = await salesQuery.getRawOne();
            const totalSales = (Number(salesResult?.totalSupply) || 0) + (Number(salesResult?.totalVat) || 0);
            const salesCount = Number(salesResult?.count) || 0;
            // 매입 합계
            const purchaseQuery = purchaseRepository.createQueryBuilder('purchase')
                .select('COALESCE(SUM(purchase.totalAmount), 0)', 'totalSupply')
                .addSelect('COALESCE(SUM(purchase.vatAmount), 0)', 'totalVat')
                .addSelect('COUNT(purchase.id)', 'count')
                .where('purchase.businessId = :businessId', { businessId: Number(businessId) })
                .andWhere('purchase.purchaseDate >= :start', { start: start.format('YYYY-MM-DD') })
                .andWhere('purchase.purchaseDate <= :end', { end: end.format('YYYY-MM-DD') });
            if (customerId) {
                purchaseQuery.andWhere('purchase.customerId = :customerId', { customerId: Number(customerId) });
            }
            const purchaseResult = await purchaseQuery.getRawOne();
            const totalPurchase = (Number(purchaseResult?.totalSupply) || 0) + (Number(purchaseResult?.totalVat) || 0);
            const purchaseCount = Number(purchaseResult?.count) || 0;
            // 수금 합계
            const receiptQuery = paymentRepository.createQueryBuilder('payment')
                .select('COALESCE(SUM(payment.amount), 0)', 'total')
                .addSelect('COUNT(payment.id)', 'count')
                .where('payment.businessId = :businessId', { businessId: Number(businessId) })
                .andWhere('payment.paymentType = :paymentType', { paymentType: '수금' })
                .andWhere('payment.paymentDate >= :start', { start: start.format('YYYY-MM-DD') })
                .andWhere('payment.paymentDate <= :end', { end: end.format('YYYY-MM-DD') });
            if (customerId) {
                receiptQuery.andWhere('payment.customerId = :customerId', { customerId: Number(customerId) });
            }
            const receiptResult = await receiptQuery.getRawOne();
            const totalReceipt = Number(receiptResult?.total) || 0;
            const receiptCount = Number(receiptResult?.count) || 0;
            // 지급 합계
            const paymentQuery = paymentRepository.createQueryBuilder('payment')
                .select('COALESCE(SUM(payment.amount), 0)', 'total')
                .addSelect('COUNT(payment.id)', 'count')
                .where('payment.businessId = :businessId', { businessId: Number(businessId) })
                .andWhere('payment.paymentType = :paymentType', { paymentType: '지급' })
                .andWhere('payment.paymentDate >= :start', { start: start.format('YYYY-MM-DD') })
                .andWhere('payment.paymentDate <= :end', { end: end.format('YYYY-MM-DD') });
            if (customerId) {
                paymentQuery.andWhere('payment.customerId = :customerId', { customerId: Number(customerId) });
            }
            const paymentResult = await paymentQuery.getRawOne();
            const totalPayment = Number(paymentResult?.total) || 0;
            const paymentCount = Number(paymentResult?.count) || 0;
            // 잔액 계산: 매출 - 매입 - 수금 + 지급
            const finalBalance = totalSales - totalPurchase - totalReceipt + totalPayment;
            const transactionCount = salesCount + purchaseCount + receiptCount + paymentCount;
            res.json({
                success: true,
                data: {
                    totalSales,
                    totalPurchase,
                    totalReceipt,
                    totalPayment,
                    finalBalance,
                    transactionCount,
                    period: {
                        start: start.format('YYYY-MM-DD'),
                        end: end.format('YYYY-MM-DD')
                    }
                }
            });
        }
        catch (error) {
            console.error('거래원장 요약 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '거래원장 요약 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 거래처별 잔액 조회
    async getCustomerBalance(req, res) {
        try {
            const { businessId, customerId } = req.params;
            const { beforeDate, excludeSaleId, excludePurchaseId } = req.query; // 특정 날짜 이전의 잔액 조회용 + 제외할 거래 ID
            const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
            const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
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
            const endDate = beforeDate ? (0, dayjs_1.default)(beforeDate) : (0, dayjs_1.default)();
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
            // 매출 합산 (날짜가 beforeDate 이전 또는 같은 날, 현재 거래 제외)
            // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
            const excludeSaleIdNum = excludeSaleId ? Number(excludeSaleId) : null;
            const excludePurchaseIdNum = excludePurchaseId ? Number(excludePurchaseId) : null;
            // 현재 거래의 createdAt을 가져와서 같은 날 거래 중 이전 거래만 포함
            let currentSaleCreatedAt = null;
            if (excludeSaleIdNum) {
                const currentSale = sales.find(s => s.id === excludeSaleIdNum);
                if (currentSale) {
                    currentSaleCreatedAt = (0, dayjs_1.default)(currentSale.createdAt);
                }
            }
            let currentPurchaseCreatedAt = null;
            if (excludePurchaseIdNum) {
                const currentPurchase = purchases.find(p => p.id === excludePurchaseIdNum);
                if (currentPurchase) {
                    currentPurchaseCreatedAt = (0, dayjs_1.default)(currentPurchase.createdAt);
                }
            }
            sales.forEach(sale => {
                // 현재 거래는 제외
                if (excludeSaleIdNum && sale.id === excludeSaleIdNum) {
                    return;
                }
                const saleDate = (0, dayjs_1.default)(sale.transactionDate);
                const saleCreatedAt = (0, dayjs_1.default)(sale.createdAt);
                // 같은 날인 경우: 현재 거래보다 먼저 생성된 거래만 포함
                const isSameDay = saleDate.isSame(endDate, 'day');
                if (isSameDay && currentSaleCreatedAt && saleCreatedAt.isAfter(currentSaleCreatedAt)) {
                    return;
                }
                // 날짜가 beforeDate 이전이거나 같은 날인 경우 포함
                if (saleDate.isSameOrBefore(endDate, 'day')) {
                    const totalAmount = (Number(sale.totalAmount) || 0) + (Number(sale.vatAmount) || 0);
                    balance += totalAmount; // 매출은 +
                    if (!lastTransactionDate || saleDate.isAfter((0, dayjs_1.default)(lastTransactionDate))) {
                        lastTransactionDate = saleDate.format('YYYY-MM-DD');
                    }
                }
            });
            // 매입 차감 (날짜가 beforeDate 이전 또는 같은 날, 현재 거래 제외)
            // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
            purchases.forEach(purchase => {
                // 현재 거래는 제외
                if (excludePurchaseIdNum && purchase.id === excludePurchaseIdNum) {
                    return;
                }
                const purchaseDate = (0, dayjs_1.default)(purchase.transactionDate || purchase.purchaseDate);
                const purchaseCreatedAt = (0, dayjs_1.default)(purchase.createdAt);
                // 같은 날인 경우: 현재 거래보다 먼저 생성된 거래만 포함
                const isSameDay = purchaseDate.isSame(endDate, 'day');
                if (isSameDay && currentPurchaseCreatedAt && purchaseCreatedAt.isAfter(currentPurchaseCreatedAt)) {
                    return;
                }
                // 날짜가 beforeDate 이전이거나 같은 날인 경우 포함
                if (purchaseDate.isSameOrBefore(endDate, 'day')) {
                    // 매입의 totalAmount는 이미 공급가액이고, vatAmount는 세액
                    const totalAmount = (Number(purchase.totalAmount) || 0) + (Number(purchase.vatAmount) || 0);
                    balance -= totalAmount; // 매입은 -
                    if (!lastTransactionDate || purchaseDate.isAfter((0, dayjs_1.default)(lastTransactionDate))) {
                        lastTransactionDate = purchaseDate.format('YYYY-MM-DD');
                    }
                }
            });
            // 수금/지급 처리 (날짜가 beforeDate 이전 또는 같은 날 포함)
            // decimal 타입은 문자열로 반환되므로 Number()로 변환 필수
            payments.forEach(payment => {
                const paymentDate = (0, dayjs_1.default)(payment.paymentDate);
                if (paymentDate.isSameOrBefore(endDate, 'day')) {
                    const paymentAmount = Number(payment.amount) || 0;
                    // 수금: 거래처로부터 돈을 받음 (받을 돈 감소)
                    if (payment.paymentType === '수금') {
                        balance -= paymentAmount;
                    }
                    // 지급: 거래처에 돈을 지급 (갚을 돈 감소 = 잔액 증가)
                    else if (payment.paymentType === '지급') {
                        balance += paymentAmount;
                    }
                    if (!lastTransactionDate || paymentDate.isAfter((0, dayjs_1.default)(lastTransactionDate))) {
                        lastTransactionDate = paymentDate.format('YYYY-MM-DD');
                    }
                }
            });
            res.json({
                success: true,
                data: {
                    customerId: Number(customerId),
                    customerName: customer.name,
                    balance: balance,
                    lastTransactionDate: lastTransactionDate || (0, dayjs_1.default)().format('YYYY-MM-DD')
                }
            });
        }
        catch (error) {
            console.error('거래처 잔액 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '거래처 잔액 조회 중 오류가 발생했습니다.'
            });
        }
    },
    // 기간 내 거래가 있는 거래처 목록 조회
    async getCustomersWithTransactions(req, res) {
        try {
            const { businessId } = req.params;
            const { startDate, endDate } = req.query;
            const salesRepository = database_1.AppDataSource.getRepository(Sales_1.Sales);
            const purchaseRepository = database_1.AppDataSource.getRepository(Purchase_1.Purchase);
            const paymentRepository = database_1.AppDataSource.getRepository(Payment_1.Payment);
            const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
            const start = startDate ? (0, dayjs_1.default)(startDate) : (0, dayjs_1.default)().startOf('month');
            const end = endDate ? (0, dayjs_1.default)(endDate) : (0, dayjs_1.default)().endOf('month');
            // 기간 내 거래가 있는 고객 ID 수집
            const customerIds = new Set();
            // 매출에서 거래처 ID 수집
            const sales = await salesRepository.find({
                where: { businessId: Number(businessId) },
                select: ['customerId', 'transactionDate']
            });
            sales.forEach(sale => {
                const saleDate = (0, dayjs_1.default)(sale.transactionDate);
                if (saleDate.isSameOrAfter(start, 'day') && saleDate.isSameOrBefore(end, 'day')) {
                    if (sale.customerId)
                        customerIds.add(sale.customerId);
                }
            });
            // 매입에서 거래처 ID 수집
            const purchases = await purchaseRepository.find({
                where: { businessId: Number(businessId) },
                select: ['customerId', 'purchaseDate']
            });
            purchases.forEach(purchase => {
                const purchaseDate = (0, dayjs_1.default)(purchase.transactionDate || purchase.purchaseDate);
                if (purchaseDate.isSameOrAfter(start, 'day') && purchaseDate.isSameOrBefore(end, 'day')) {
                    if (purchase.customerId)
                        customerIds.add(purchase.customerId);
                }
            });
            // 수금/지급에서 거래처 ID 수집
            const payments = await paymentRepository.find({
                where: { businessId: Number(businessId) },
                select: ['customerId', 'paymentDate']
            });
            payments.forEach(payment => {
                const paymentDate = (0, dayjs_1.default)(payment.paymentDate);
                if (paymentDate.isSameOrAfter(start, 'day') && paymentDate.isSameOrBefore(end, 'day')) {
                    if (payment.customerId)
                        customerIds.add(payment.customerId);
                }
            });
            // 거래처 정보 조회
            const customerIdArray = Array.from(customerIds);
            let customers = [];
            if (customerIdArray.length > 0) {
                customers = await customerRepository
                    .createQueryBuilder('customer')
                    .where('customer.id IN (:...ids)', { ids: customerIdArray })
                    .andWhere('customer.businessId = :businessId', { businessId: Number(businessId) })
                    .orderBy('customer.name', 'ASC')
                    .getMany();
            }
            res.json({
                success: true,
                data: {
                    customers: customers.map(c => ({
                        id: c.id,
                        name: c.name,
                        customerCode: c.customerCode,
                        businessNumber: c.businessNumber,
                        representative: c.representative
                    }))
                }
            });
        }
        catch (error) {
            console.error('기간 내 거래 업체 조회 오류:', error);
            res.status(500).json({
                success: false,
                message: '기간 내 거래 업체 조회 중 오류가 발생했습니다.'
            });
        }
    }
};
//# sourceMappingURL=transactionLedgerController.js.map