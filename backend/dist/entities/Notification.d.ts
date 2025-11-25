import { User } from './User';
import { Business } from './Business';
export declare class Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    priority: string;
    metadata?: any;
    user: User;
    userId: number;
    business?: Business;
    businessId?: number;
    relatedId?: number;
    relatedType?: string;
    createdAt: Date;
}
//# sourceMappingURL=Notification.d.ts.map