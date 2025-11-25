"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transactionLedgerController_1 = require("../controllers/transactionLedgerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const businessAccessMiddleware_1 = require("../middleware/businessAccessMiddleware");
const router = express_1.default.Router();
// 모든 라우트에 인증 미들웨어 적용
router.use(authMiddleware_1.authMiddleware);
// 거래원장 조회
router.get('/:businessId/ledger', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getLedger);
// 거래원장 상세 내역 조회
router.get('/:businessId/ledger/details', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getLedgerDetails);
// 거래원장 요약 정보 조회
router.get('/:businessId/ledger/summary', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getLedgerSummary);
// 거래처별 잔액 조회
router.get('/:businessId/customer/:customerId/balance', businessAccessMiddleware_1.businessAccessMiddleware, transactionLedgerController_1.transactionLedgerController.getCustomerBalance);
exports.default = router;
//# sourceMappingURL=transactionLedgerRoutes.js.map