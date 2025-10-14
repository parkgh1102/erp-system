import express from 'express';
import { transactionLedgerController } from '../controllers/transactionLedgerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';

const router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 거래원장 조회
router.get('/:businessId/ledger', businessAccessMiddleware, transactionLedgerController.getLedger);

// 거래원장 상세 내역 조회
router.get('/:businessId/ledger/details', businessAccessMiddleware, transactionLedgerController.getLedgerDetails);

// 거래원장 요약 정보 조회
router.get('/:businessId/ledger/summary', businessAccessMiddleware, transactionLedgerController.getLedgerSummary);

// 거래처별 잔액 조회
router.get('/:businessId/ledger/balance/:customerId', businessAccessMiddleware, transactionLedgerController.getCustomerBalance);

export default router;