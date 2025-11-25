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
const auth_1 = require("../middleware/auth");
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
router.get('/', BusinessController_1.BusinessController.getAll);
router.get('/:id', BusinessController_1.BusinessController.getById);
router.post('/', BusinessController_1.BusinessController.create);
router.put('/:id', BusinessController_1.BusinessController.update);
router.delete('/:id', BusinessController_1.BusinessController.delete);
router.get('/validate/:businessNumber', BusinessController_1.BusinessController.validateBusinessNumber);
// 거래처 관리 API 라우트
router.post('/:businessId/customers', CustomerController_1.CustomerController.create);
router.get('/:businessId/customers', CustomerController_1.CustomerController.getAll);
router.delete('/:businessId/customers/all', CustomerController_1.CustomerController.deleteAll); // 전체 삭제 (개별 삭제보다 먼저)
router.get('/:businessId/customers/:id', CustomerController_1.CustomerController.getById);
router.put('/:businessId/customers/:id', CustomerController_1.CustomerController.update);
router.delete('/:businessId/customers/:id', CustomerController_1.CustomerController.delete);
// 품목 관리 API 라우트
router.post('/:businessId/products', ProductController_1.ProductController.create);
router.get('/:businessId/products', ProductController_1.ProductController.getAll);
router.get('/:businessId/products/:id', ProductController_1.ProductController.getById);
router.put('/:businessId/products/:id', ProductController_1.ProductController.update);
router.delete('/:businessId/products/:id', ProductController_1.ProductController.delete);
// 매출 관리 API 라우트
router.post('/:businessId/sales', SalesController_1.SalesController.create);
router.get('/:businessId/sales', SalesController_1.SalesController.getAll);
router.get('/:businessId/sales/:id', SalesController_1.SalesController.getById);
router.put('/:businessId/sales/:id', SalesController_1.SalesController.update);
router.delete('/:businessId/sales/:id', SalesController_1.SalesController.delete);
router.post('/:businessId/sales/:id/sign', SalesController_1.SalesController.signSales);
router.post('/:businessId/sales/:id/upload-statement', upload.single('image'), SalesController_1.SalesController.uploadStatement);
router.post('/:businessId/sales/:id/send-alimtalk', SalesController_1.SalesController.sendAlimtalk);
// 매입 관리 API 라우트
router.post('/:businessId/purchases', PurchaseController_1.PurchaseController.create);
router.get('/:businessId/purchases', PurchaseController_1.PurchaseController.getAll);
router.get('/:businessId/purchases/:id', PurchaseController_1.PurchaseController.getById);
router.put('/:businessId/purchases/:id', PurchaseController_1.PurchaseController.update);
router.delete('/:businessId/purchases/:id', PurchaseController_1.PurchaseController.delete);
// 결제 관리 API 라우트
router.post('/:businessId/payments', PaymentController_1.PaymentController.create);
router.get('/:businessId/payments', PaymentController_1.PaymentController.getAll);
router.get('/:businessId/payments/:id', PaymentController_1.PaymentController.getById);
router.put('/:businessId/payments/:id', PaymentController_1.PaymentController.update);
router.delete('/:businessId/payments/:id', PaymentController_1.PaymentController.delete);
// 거래원장 API 라우트
router.get('/:businessId/transaction-ledger', transactionLedgerController_1.transactionLedgerController.getLedger);
router.get('/:businessId/transaction-ledger/summary', transactionLedgerController_1.transactionLedgerController.getLedgerSummary);
// 대시보드 API 라우트
router.get('/:businessId/dashboard/stats', DashboardController_1.DashboardController.getStats);
router.get('/:businessId/dashboard/recent-transactions', DashboardController_1.DashboardController.getRecentTransactions);
router.get('/:businessId/dashboard/sales-chart', DashboardController_1.DashboardController.getSalesChart);
router.get('/:businessId/dashboard/category-data', DashboardController_1.DashboardController.getCategoryData);
router.get('/:businessId/dashboard/monthly-trend', DashboardController_1.DashboardController.getMonthlyTrend);
router.get('/:businessId/dashboard/all-transactions', DashboardController_1.DashboardController.getAllTransactions);
//# sourceMappingURL=businessRoutes.js.map