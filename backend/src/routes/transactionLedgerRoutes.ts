import express, { Router } from 'express';
import { transactionLedgerController } from '../controllers/transactionLedgerController';
import { authMiddleware } from '../middleware/authMiddleware';
import { businessAccessMiddleware } from '../middleware/businessAccessMiddleware';
import { requireWriteRole } from '../middleware/requireWriteRole';

const router: Router = express.Router();

// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 거래원장 조회
router.get('/:businessId/ledger', businessAccessMiddleware, transactionLedgerController.getLedger);

// 거래원장 상세 내역 조회
router.get('/:businessId/ledger/details', businessAccessMiddleware, transactionLedgerController.getLedgerDetails);

// 거래원장 요약 정보 조회
router.get('/:businessId/ledger/summary', businessAccessMiddleware, transactionLedgerController.getLedgerSummary);

// 거래처별 잔액 조회
router.get('/:businessId/customer/:customerId/balance', businessAccessMiddleware, transactionLedgerController.getCustomerBalance);

// 미수금 안내 알림톡 전송 (조회 전용 역할은 requireWriteRole이 차단)
router.post(
  '/:businessId/customer/:customerId/receivable-notice',
  businessAccessMiddleware,
  requireWriteRole,
  transactionLedgerController.sendReceivableNotice
);

// 미수금 안내 알림톡 일괄 전송
router.post(
  '/:businessId/receivable-notices',
  businessAccessMiddleware,
  requireWriteRole,
  transactionLedgerController.sendReceivableNoticesBulk
);

// 기간 내 거래가 있는 거래처 목록 조회
router.get('/:businessId/customers-with-transactions', businessAccessMiddleware, transactionLedgerController.getCustomersWithTransactions);

export default router;