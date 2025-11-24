import { Router } from 'express';
import { BusinessController } from '../controllers/BusinessController';
import { CustomerController } from '../controllers/CustomerController';
import { ProductController } from '../controllers/ProductController';
import { SalesController } from '../controllers/SalesController';
import { PurchaseController } from '../controllers/PurchaseController';
import { PaymentController } from '../controllers/PaymentController';
import { DashboardController } from '../controllers/DashboardController';
import { transactionLedgerController } from '../controllers/transactionLedgerController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Multer 설정 (메모리 스토리지 사용, limits 추가)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// 모든 business 라우트에 인증 미들웨어 적용
router.use(authenticateToken);

// 사업자 관리 API 라우트
router.get('/', BusinessController.getAll);
router.get('/:id', BusinessController.getById);
router.post('/', BusinessController.create);
router.put('/:id', BusinessController.update);
router.delete('/:id', BusinessController.delete);
router.get('/validate/:businessNumber', BusinessController.validateBusinessNumber);

// 거래처 관리 API 라우트
router.post('/:businessId/customers', CustomerController.create);
router.get('/:businessId/customers', CustomerController.getAll);
router.delete('/:businessId/customers/all', CustomerController.deleteAll); // 전체 삭제 (개별 삭제보다 먼저)
router.get('/:businessId/customers/:id', CustomerController.getById);
router.put('/:businessId/customers/:id', CustomerController.update);
router.delete('/:businessId/customers/:id', CustomerController.delete);

// 품목 관리 API 라우트
router.post('/:businessId/products', ProductController.create);
router.get('/:businessId/products', ProductController.getAll);
router.get('/:businessId/products/:id', ProductController.getById);
router.put('/:businessId/products/:id', ProductController.update);
router.delete('/:businessId/products/:id', ProductController.delete);

// 매출 관리 API 라우트
router.post('/:businessId/sales', SalesController.create);
router.get('/:businessId/sales', SalesController.getAll);
router.get('/:businessId/sales/:id', SalesController.getById);
router.put('/:businessId/sales/:id', SalesController.update);
router.delete('/:businessId/sales/:id', SalesController.delete);
router.post('/:businessId/sales/:id/sign', SalesController.signSales);
router.post('/:businessId/sales/:id/upload-statement', upload.single('image'), SalesController.uploadStatement);
router.post('/:businessId/sales/:id/send-alimtalk', SalesController.sendAlimtalk);

// 매입 관리 API 라우트
router.post('/:businessId/purchases', PurchaseController.create);
router.get('/:businessId/purchases', PurchaseController.getAll);
router.get('/:businessId/purchases/:id', PurchaseController.getById);
router.put('/:businessId/purchases/:id', PurchaseController.update);
router.delete('/:businessId/purchases/:id', PurchaseController.delete);

// 결제 관리 API 라우트
router.post('/:businessId/payments', PaymentController.create);
router.get('/:businessId/payments', PaymentController.getAll);
router.get('/:businessId/payments/:id', PaymentController.getById);
router.put('/:businessId/payments/:id', PaymentController.update);
router.delete('/:businessId/payments/:id', PaymentController.delete);

// 거래원장 API 라우트
router.get('/:businessId/transaction-ledger', transactionLedgerController.getLedger);
router.get('/:businessId/transaction-ledger/summary', transactionLedgerController.getLedgerSummary);

// 대시보드 API 라우트
router.get('/:businessId/dashboard/stats', DashboardController.getStats);
router.get('/:businessId/dashboard/recent-transactions', DashboardController.getRecentTransactions);
router.get('/:businessId/dashboard/sales-chart', DashboardController.getSalesChart);
router.get('/:businessId/dashboard/category-data', DashboardController.getCategoryData);
router.get('/:businessId/dashboard/monthly-trend', DashboardController.getMonthlyTrend);
router.get('/:businessId/dashboard/all-transactions', DashboardController.getAllTransactions);

export { router as businessRoutes };