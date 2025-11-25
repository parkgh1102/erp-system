"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.NotificationController = void 0;
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
class NotificationController {
    constructor() {
        this.notificationRepository = database_1.AppDataSource.getRepository(Notification_1.Notification);
    }
    // 알림 생성
    async createNotification(req, res) {
        try {
            const { type, title, message, link, priority, metadata } = req.body;
            const userId = req.user?.userId;
            const businessId = req.user?.businessId;
            const notification = this.notificationRepository.create({
                type,
                title,
                message,
                link,
                priority: priority || 'info',
                metadata,
                userId,
                businessId,
            });
            await this.notificationRepository.save(notification);
            return res.status(201).json({
                success: true,
                message: '알림이 생성되었습니다.',
                data: { notification }
            });
        }
        catch (error) {
            console.error('알림 생성 오류:', error);
            return res.status(500).json({
                success: false,
                message: '알림 생성에 실패했습니다.'
            });
        }
    }
    // 사용자의 알림 조회
    async getUserNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            const { limit = 20, offset = 0, isRead } = req.query;
            const queryBuilder = this.notificationRepository
                .createQueryBuilder('notification')
                .where('notification.userId = :userId', { userId })
                .orderBy('notification.createdAt', 'DESC')
                .take(Number(limit))
                .skip(Number(offset));
            // 읽음 여부 필터
            if (isRead !== undefined) {
                queryBuilder.andWhere('notification.isRead = :isRead', {
                    isRead: isRead === 'true'
                });
            }
            const [notifications, total] = await queryBuilder.getManyAndCount();
            return res.status(200).json({
                success: true,
                data: {
                    notifications,
                    total,
                    limit: Number(limit),
                    offset: Number(offset)
                }
            });
        }
        catch (error) {
            console.error('알림 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '알림 조회에 실패했습니다.'
            });
        }
    }
    // 미읽은 알림 개수 조회
    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.userId;
            const count = await this.notificationRepository.count({
                where: {
                    userId,
                    isRead: false
                }
            });
            return res.status(200).json({
                success: true,
                data: { count }
            });
        }
        catch (error) {
            console.error('미읽은 알림 개수 조회 오류:', error);
            return res.status(500).json({
                success: false,
                message: '미읽은 알림 개수 조회에 실패했습니다.'
            });
        }
    }
    // 알림을 읽음으로 표시
    async markAsRead(req, res) {
        try {
            const notificationId = Number(req.params.id);
            const userId = req.user?.userId;
            const notification = await this.notificationRepository.findOne({
                where: {
                    id: notificationId,
                    userId
                }
            });
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: '알림을 찾을 수 없습니다.'
                });
            }
            notification.isRead = true;
            await this.notificationRepository.save(notification);
            return res.status(200).json({
                success: true,
                message: '알림을 읽음으로 표시했습니다.',
                data: { notification }
            });
        }
        catch (error) {
            console.error('알림 읽음 처리 오류:', error);
            return res.status(500).json({
                success: false,
                message: '알림 읽음 처리에 실패했습니다.'
            });
        }
    }
    // 모든 알림을 읽음으로 표시
    async markAllAsRead(req, res) {
        try {
            const userId = req.user?.userId;
            await this.notificationRepository
                .createQueryBuilder()
                .update(Notification_1.Notification)
                .set({ isRead: true })
                .where('userId = :userId AND isRead = :isRead', {
                userId,
                isRead: false
            })
                .execute();
            return res.status(200).json({
                success: true,
                message: '모든 알림을 읽음으로 표시했습니다.'
            });
        }
        catch (error) {
            console.error('모든 알림 읽음 처리 오류:', error);
            return res.status(500).json({
                success: false,
                message: '모든 알림 읽음 처리에 실패했습니다.'
            });
        }
    }
    // 알림 삭제
    async deleteNotification(req, res) {
        try {
            const notificationId = Number(req.params.id);
            const userId = req.user?.userId;
            const notification = await this.notificationRepository.findOne({
                where: {
                    id: notificationId,
                    userId
                }
            });
            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: '알림을 찾을 수 없습니다.'
                });
            }
            await this.notificationRepository.remove(notification);
            return res.status(200).json({
                success: true,
                message: '알림이 삭제되었습니다.'
            });
        }
        catch (error) {
            console.error('알림 삭제 오류:', error);
            return res.status(500).json({
                success: false,
                message: '알림 삭제에 실패했습니다.'
            });
        }
    }
    // 모든 알림 삭제
    async deleteAllNotifications(req, res) {
        try {
            const userId = req.user?.userId;
            await this.notificationRepository
                .createQueryBuilder()
                .delete()
                .from(Notification_1.Notification)
                .where('userId = :userId', { userId })
                .execute();
            return res.status(200).json({
                success: true,
                message: '모든 알림이 삭제되었습니다.'
            });
        }
        catch (error) {
            console.error('모든 알림 삭제 오류:', error);
            return res.status(500).json({
                success: false,
                message: '모든 알림 삭제에 실패했습니다.'
            });
        }
    }
}
exports.NotificationController = NotificationController;
// 알림 생성 헬퍼 함수
const createNotification = async (userId, businessId, type, title, message, link, priority = 'info', metadata) => {
    try {
        const notificationRepository = database_1.AppDataSource.getRepository(Notification_1.Notification);
        const notification = notificationRepository.create({
            userId,
            businessId,
            type,
            title,
            message,
            link,
            priority,
            metadata
        });
        await notificationRepository.save(notification);
        return notification;
    }
    catch (error) {
        console.error('알림 생성 헬퍼 오류:', error);
        return null;
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=NotificationController.js.map