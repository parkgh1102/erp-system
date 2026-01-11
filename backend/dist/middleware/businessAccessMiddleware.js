"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessAccessMiddleware = void 0;
const database_1 = require("../config/database");
const Business_1 = require("../entities/Business");
const businessAccessMiddleware = async (req, res, next) => {
    try {
        const { businessId } = req.params;
        const userId = req.user?.userId;
        if (!businessId) {
            return res.status(400).json({
                success: false,
                message: '필수 파라미터가 누락되었습니다.'
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: '사용자 인증 정보가 필요합니다.'
            });
        }
        const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
        const business = await businessRepository.findOne({
            where: {
                id: Number(businessId),
                userId,
                isActive: true
            }
        });
        if (!business) {
            return res.status(404).json({
                success: false,
                message: '사업자를 찾을 수 없거나 접근 권한이 없습니다.'
            });
        }
        next();
    }
    catch (error) {
        console.error('사업자 접근 권한 확인 오류:', error);
        return res.status(500).json({
            success: false,
            message: '사업자 접근 권한 확인 중 오류가 발생했습니다.'
        });
    }
};
exports.businessAccessMiddleware = businessAccessMiddleware;
//# sourceMappingURL=businessAccessMiddleware.js.map