import { BackupConfig } from '../entities/BackupConfig';
import { BackupHistory } from '../entities/BackupHistory';
declare class BackupSchedulerService {
    private scheduledJobs;
    private backupDir;
    constructor();
    private ensureBackupDirectory;
    initialize(): Promise<void>;
    private getCronExpression;
    scheduleBackup(config: BackupConfig): Promise<void>;
    cancelSchedule(businessId: number): void;
    performBackup(businessId: number, backupType?: 'scheduled' | 'manual'): Promise<BackupHistory>;
    private cleanupOldBackups;
    restoreBackup(businessId: number, historyId: number): Promise<{
        customers: number;
        products: number;
        sales: number;
        purchases: number;
        payments: number;
    }>;
    getBackupFilePath(history: BackupHistory): string | null;
}
export declare const backupSchedulerService: BackupSchedulerService;
export default backupSchedulerService;
//# sourceMappingURL=BackupSchedulerService.d.ts.map