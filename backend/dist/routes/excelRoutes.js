"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const ExcelController_1 = require("../controllers/ExcelController");
const router = express_1.default.Router();
// 메모리에 파일 저장
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        }
        else {
            cb(new Error('Excel 파일만 업로드 가능합니다.'));
        }
    }
});
// 템플릿 다운로드
router.get('/template/customers', auth_1.authenticateToken, ExcelController_1.generateCustomerTemplate);
router.get('/template/products', auth_1.authenticateToken, ExcelController_1.generateProductTemplate);
router.get('/template/sales', auth_1.authenticateToken, ExcelController_1.generateSalesTemplate);
router.get('/template/purchases', auth_1.authenticateToken, ExcelController_1.generatePurchaseTemplate);
router.get('/template/receivables', auth_1.authenticateToken, ExcelController_1.generateReceivableTemplate);
router.get('/template/payables', auth_1.authenticateToken, ExcelController_1.generatePayableTemplate);
// 업로드
router.post('/:businessId/upload/customers', auth_1.authenticateToken, upload.single('file'), ExcelController_1.uploadCustomers);
router.post('/:businessId/upload/products', auth_1.authenticateToken, upload.single('file'), ExcelController_1.uploadProducts);
router.post('/:businessId/upload/sales', auth_1.authenticateToken, upload.single('file'), ExcelController_1.uploadSales);
router.post('/:businessId/upload/purchases', auth_1.authenticateToken, upload.single('file'), ExcelController_1.uploadPurchases);
exports.default = router;
//# sourceMappingURL=excelRoutes.js.map