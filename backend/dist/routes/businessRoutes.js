"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutes = void 0;
const express_1 = require("express");
const BusinessController_1 = require("../controllers/BusinessController");
const CustomerController_1 = require("../controllers/CustomerController");
const ProductController_1 = require("../controllers/ProductController");
const SalesController_1 = require("../controllers/SalesController");
const PurchaseController_1 = require("../controllers/PurchaseController");
const PaymentController_1 = require("../controllers/PaymentController");
const DashboardController_1 = require("../controllers/DashboardController");
const transactionLedgerController_1 = require("../controllers/transactionLedgerController");
const QuotationController_1 = require("../controllers/QuotationController");
const PurchaseOrderController_1 = require("../controllers/PurchaseOrderController");
const auth_1 = require("../middleware/auth");
const businessAccessMiddleware_1 = require("../middleware/businessAccessMiddleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
exports.businessRoutes = router;
// Multer 설정 (메모리 스토리지 사용, limits 추가)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});
// 모든 business 라우트에 인증 미들웨어 적용
router.use(auth_1.authenticateToken);
// 사업자 관리 API 라우트
// 특정 경로를 파라미터 경로보다 먼저 정의
router.get('/validate/:businessNumber', BusinessController_1.BusinessController.validateBusinessNumber);
router.get('/', BusinessController_1.BusinessController.getAll);
router.post('/', BusinessController_1.BusinessController.create);
// 파라미터가 있는 경로 (seal 경로를 /:id보다 먼저)
router.get('/:id/seal', BusinessController_1.BusinessController.getSealImage);
router.post('/:id/seal', upload.single('seal'), BusinessController_1.BusinessController.uploadSealImage);
router.delete('/:id/seal', BusinessController_1.BusinessController.deleteSealImage);
router.get('/:id', BusinessController_1.BusinessController.getById);
router.put('/:id', BusinessController_1.BusinessController.update);
router.delete('/:id', BusinessController_1.BusinessController.delete);
// 거래처 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/customers', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.create);
router.get('/:businessId/customers', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.getAll);
router.delete('/:businessId/customers/all', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.deleteAll);
router.get('/:businessId/customers/:id', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.getById);
router.put('/:businessId/customers/:id', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.update);
router.delete('/:businessId/customers/:id', businessAccessMiddleware_1.businessAccessMiddleware, CustomerController_1.CustomerController.delete);
// 품목 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/products', businessAccessMiddleware_1.businessAccessMiddleware, ProductController_1.ProductController.create);
router.get('/:businessId/products', businessAccessMiddleware_1.businessAccessMiddleware, ProductController_1.ProductController.getAll);
router.get('/:businessId/products/:id', businessAccessMiddleware_1.businessAccessMiddleware, ProductController_1.ProductController.getById);
router.put('/:businessId/products/:id', businessAccessMiddleware_1.businessAccessMiddleware, ProductController_1.ProductController.update);
router.delete('/:businessId/products/:id', businessAccessMiddleware_1.businessAccessMiddleware, ProductController_1.ProductController.delete);
// 매출 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/sales', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.create);
router.get('/:businessId/sales', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.getAll);
router.get('/:businessId/sales/:id', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.getById);
router.put('/:businessId/sales/:id', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.update);
router.delete('/:businessId/sales/:id', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.delete);
router.post('/:businessId/sales/:id/sign', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.signSales);
router.post('/:businessId/sales/:id/upload-statement', businessAccessMiddleware_1.businessAccessMiddleware, upload.single('image'), SalesController_1.SalesController.uploadStatement);
router.post('/:businessId/sales/:id/send-alimtalk', businessAccessMiddleware_1.businessAccessMiddleware, SalesController_1.SalesController.sendAlimtalk);
// 매입 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/purchases', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseController_1.PurchaseController.create);
router.get('/:businessId/purchases', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseController_1.PurchaseController.getAll);
router.get('/:businessId/purchases/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseController_1.PurchaseController.getById);
router.put('/:businessId/purchases/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseController_1.PurchaseController.update);
router.delete('/:businessId/purchases/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseController_1.PurchaseController.delete);
// 결제 관리 API 라우트 (businessAccessMiddleware 적용)
router.post('/:businessId/payments', businessAccessMiddleware_1.businessAccessMiddleware, PaymentController_1.PaymentController.create);
router.get('/:businessId/payments', businessAccessMiddleware_1.businessAccessMiddleware, PaymentController_1.PaymentController.getAll);
router.get('/:businessId/payments/:id', businessAccessMiddleware_1.businessAccessMiddleware, PaymentController_1.PaymentController.getById);
router.put('/:businessId/payments/:id', businessAccessMiddleware_1.businessAccessMiddleware, PaymentController_1.PaymentController.update);
router.delete('/:businessId/payments/:id', businessAccessMiddleware_1.businessAccessMiddleware, PaymentController_1.PaymentController.delete);
// 거래원장 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/transaction-ledger', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getLedger);
router.get('/:businessId/transaction-ledger/summary', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getLedgerSummary);
// 대시보드 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/dashboard/stats', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getStats);
router.get('/:businessId/dashboard/recent-transactions', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getRecentTransactions);
router.get('/:businessId/dashboard/sales-chart', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getSalesChart);
router.get('/:businessId/dashboard/category-data', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getCategoryData);
router.get('/:businessId/dashboard/monthly-trend', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getMonthlyTrend);
router.get('/:businessId/dashboard/all-transactions', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getAllTransactions);
router.get('/:businessId/dashboard/top-customers', businessAccessMiddleware_1.businessAccessMiddleware, DashboardController_1.DashboardController.getTopCustomers);
// 견적서 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/quotations/next-number', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.getNextNumber);
router.get('/:businessId/quotations', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.getAll);
router.post('/:businessId/quotations', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.create);
router.get('/:businessId/quotations/:id', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.getById);
router.put('/:businessId/quotations/:id', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.update);
router.delete('/:businessId/quotations/:id', businessAccessMiddleware_1.businessAccessMiddleware, QuotationController_1.QuotationController.delete);
// 발주서 API 라우트 (businessAccessMiddleware 적용)
router.get('/:businessId/purchase-orders/next-number', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.getNextNumber);
router.get('/:businessId/purchase-orders', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.getAll);
router.post('/:businessId/purchase-orders', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.create);
router.get('/:businessId/purchase-orders/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.getById);
router.put('/:businessId/purchase-orders/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.update);
router.delete('/:businessId/purchase-orders/:id', businessAccessMiddleware_1.businessAccessMiddleware, PurchaseOrderController_1.PurchaseOrderController.delete);
//# sourceMappingURL=businessRoutes.js.map