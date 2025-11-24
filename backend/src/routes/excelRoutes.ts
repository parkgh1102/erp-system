import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
  generateCustomerTemplate,
  generateProductTemplate,
  generateSalesTemplate,
  generatePurchaseTemplate,
  generateReceivableTemplate,
  generatePayableTemplate,
  uploadCustomers,
  uploadProducts,
  uploadSales,
  uploadPurchases
} from '../controllers/ExcelController';

const router = express.Router();

// 메모리에 파일 저장
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Excel 파일만 업로드 가능합니다.'));
    }
  }
});

// 템플릿 다운로드
router.get('/template/customers', authenticateToken, generateCustomerTemplate);
router.get('/template/products', authenticateToken, generateProductTemplate);
router.get('/template/sales', authenticateToken, generateSalesTemplate);
router.get('/template/purchases', authenticateToken, generatePurchaseTemplate);
router.get('/template/receivables', authenticateToken, generateReceivableTemplate);
router.get('/template/payables', authenticateToken, generatePayableTemplate);

// 업로드
router.post('/:businessId/upload/customers', authenticateToken, upload.single('file'), uploadCustomers);
router.post('/:businessId/upload/products', authenticateToken, upload.single('file'), uploadProducts);
router.post('/:businessId/upload/sales', authenticateToken, upload.single('file'), uploadSales);
router.post('/:businessId/upload/purchases', authenticateToken, upload.single('file'), uploadPurchases);

export default router;
