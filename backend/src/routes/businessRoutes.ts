import { Router } from 'express';
import { BusinessController } from '../controllers/BusinessController';
import { CustomerController } from '../controllers/CustomerController';
import { ProductController } from '../controllers/ProductController';
import { SalesController } from '../controllers/SalesController';
import { PurchaseController } from '../controllers/PurchaseController';
import { PaymentController } from '../controllers/PaymentController';
import { DashboardController } from '../controllers/DashboardController';
import { transactionLedgerController } from '../controllers/transactionLedgerController';
import { QuotationController } from '../controllers/QuotationController';
import { PurchaseOrderController } from '../controllers/PurchaseOrderController';
import { authenticateToken } from '../middleware/auth';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';
import multer from 'multer';

const router: Router = Router();

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
// 특정 경로를 파라미터 경로보다 먼저 정의
router.get('/validate/:businessNumber', BusinessController.validateBusinessNumber);
router.get('/', BusinessController.getAll);
router.post('/', BusinessController.create);
// 파라미터가 있는 경로 (seal 경로를 /:id보다 먼저)
router.get('/:id/seal', BusinessController.getSealImage);
router.post('/:id/seal', upload.single('seal'), BusinessController.uploadSealImage);
router.delete('/:id/seal', BusinessController.deleteSealImage);
router.get('/:id', BusinessController.getById);
router.put('/:id', BusinessController.update);
router.delete('/:id', BusinessController.delete);

// 거래처 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/customers', businessAccessMiddleware, CustomerController.create);
router.get('/:businessId/customers', businessAccessMiddleware, CustomerController.getAll);
router.delete('/:businessId/customers/all', businessAccessMiddleware, CustomerController.deleteAll);
router.get('/:businessId/customers/:id', businessAccessMiddleware, CustomerController.getById);
router.put('/:businessId/customers/:id', businessAccessMiddleware, CustomerController.update);
router.delete('/:businessId/customers/:id', businessAccessMiddleware, CustomerController.delete);

// 품목 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/products', businessAccessMiddleware, ProductController.create);
router.get('/:businessId/products', businessAccessMiddleware, ProductController.getAll);
router.get('/:businessId/products/:id', businessAccessMiddleware, ProductController.getById);
router.put('/:businessId/products/:id', businessAccessMiddleware, ProductController.update);
router.delete('/:businessId/products/:id', businessAccessMiddleware, ProductController.delete);

// 매출 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/sales', businessAccessMiddleware, SalesController.create);
router.get('/:businessId/sales', businessAccessMiddleware, SalesController.getAll);
router.get('/:businessId/sales/:id', businessAccessMiddleware, SalesController.getById);
router.put('/:businessId/sales/:id', businessAccessMiddleware, SalesController.update);
router.delete('/:businessId/sales/:id', businessAccessMiddleware, SalesController.delete);
router.post('/:businessId/sales/:id/sign', businessAccessMiddleware, SalesController.signSales);
router.post('/:businessId/sales/:id/upload-statement', businessAccessMiddleware, upload.single('image'), SalesController.uploadStatement);
router.post('/:businessId/sales/:id/send-alimtalk', businessAccessMiddleware, SalesController.sendAlimtalk);

// 매입 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/purchases', businessAccessMiddleware, PurchaseController.create);
router.get('/:businessId/purchases', businessAccessMiddleware, PurchaseController.getAll);
router.get('/:businessId/purchases/:id', businessAccessMiddleware, PurchaseController.getById);
router.put('/:businessId/purchases/:id', businessAccessMiddleware, PurchaseController.update);
router.delete('/:businessId/purchases/:id', businessAccessMiddleware, PurchaseController.delete);

// 결제 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/payments', businessAccessMiddleware, PaymentController.create);
router.get('/:businessId/payments', businessAccessMiddleware, PaymentController.getAll);
router.get('/:businessId/payments/:id', businessAccessMiddleware, PaymentController.getById);
router.put('/:businessId/payments/:id', businessAccessMiddleware, PaymentController.update);
router.delete('/:businessId/payments/:id', businessAccessMiddleware, PaymentController.delete);

// 거래원장 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/transaction-ledger', businessAccessMiddleware, transactionLedgerController.getLedger);
router.get('/:businessId/transaction-ledger/summary', businessAccessMiddleware, transactionLedgerController.getLedgerSummary);

// 대시보드 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/dashboard/stats', businessAccessMiddleware, DashboardController.getStats);
router.get('/:businessId/dashboard/recent-transactions', businessAccessMiddleware, DashboardController.getRecentTransactions);
router.get('/:businessId/dashboard/sales-chart', businessAccessMiddleware, DashboardController.getSalesChart);
router.get('/:businessId/dashboard/category-data', businessAccessMiddleware, DashboardController.getCategoryData);
router.get('/:businessId/dashboard/monthly-trend', businessAccessMiddleware, DashboardController.getMonthlyTrend);
router.get('/:businessId/dashboard/all-transactions', businessAccessMiddleware, DashboardController.getAllTransactions);
router.get('/:businessId/dashboard/top-customers', businessAccessMiddleware, DashboardController.getTopCustomers);

// 견적서 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/quotations/next-number', businessAccessMiddleware, QuotationController.getNextNumber);
router.get('/:businessId/quotations', businessAccessMiddleware, QuotationController.getAll);
router.post('/:businessId/quotations', businessAccessMiddleware, QuotationController.create);
router.get('/:businessId/quotations/:id', businessAccessMiddleware, QuotationController.getById);
router.put('/:businessId/quotations/:id', businessAccessMiddleware, QuotationController.update);
router.delete('/:businessId/quotations/:id', businessAccessMiddleware, QuotationController.delete);

// 발주서 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/purchase-orders/next-number', businessAccessMiddleware, PurchaseOrderController.getNextNumber);
router.get('/:businessId/purchase-orders', businessAccessMiddleware, PurchaseOrderController.getAll);
router.post('/:businessId/purchase-orders', businessAccessMiddleware, PurchaseOrderController.create);
router.get('/:businessId/purchase-orders/:id', businessAccessMiddleware, PurchaseOrderController.getById);
router.put('/:businessId/purchase-orders/:id', businessAccessMiddleware, PurchaseOrderController.update);
router.delete('/:businessId/purchase-orders/:id', businessAccessMiddleware, PurchaseOrderController.delete);

export { router as businessRoutes };