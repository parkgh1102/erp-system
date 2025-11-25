import { Request, Response } from 'express';
import { Notification } from '../entities/Notification';
export declare class NotificationController {
    private notificationRepository;
    createNotification(req: Request, res: Response): Promise<Response>;
    getUserNotifications(req: Request, res: Response): Promise<Response>;
    getUnreadCount(req: Request, res: Response): Promise<Response>;
    markAsRead(req: Request, res: Response): Promise<Response>;
    markAllAsRead(req: Request, res: Response): Promise<Response>;
    deleteNotification(req: Request, res: Response): Promise<Response>;
    deleteAllNotifications(req: Request, res: Response): Promise<Response>;
}
export declare const createNotification: (userId: number, businessId: number | undefined, type: string, title: string, message: string, link?: string, priority?: string, metadata?: any) => Promise<Notification>;
//# sourceMappingURL=NotificationController.d.ts.map