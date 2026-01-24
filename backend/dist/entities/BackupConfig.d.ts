import { Business } from './Business';
export type BackupScheduleType = 'daily' | 'weekly' | 'monthly' | 'manual';
export declare class BackupConfig {
    id: number;
    business: Business;
    businessId: number;
    enabled: boolean;
    scheduleType: BackupScheduleType;
    scheduleTime: string;
    scheduleDay?: number;
    retentionCount: number;
    lastBackupAt?: Date;
    nextBackupAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=BackupConfig.d.ts.map