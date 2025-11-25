import { User } from './User';
import { Business } from './Business';
export declare class ActivityLog {
    id: number;
    actionType: string;
    entity: string;
    entityId?: number;
    description?: string;
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    os?: string;
    metadata?: any;
    user?: User;
    userId?: number;
    business?: Business;
    businessId?: number;
    createdAt: Date;
}
//# sourceMappingURL=ActivityLog.d.ts.map