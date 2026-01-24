import { Business } from './Business';
export type BackupStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type BackupType = 'scheduled' | 'manual';
export declare class BackupHistory {
    id: number;
    business: Business;
    businessId: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    status: BackupStatus;
    backupType: BackupType;
    errorMessage?: string;
    customersCount: number;
    productsCount: number;
    salesCount: number;
    purchasesCount: number;
    paymentsCount: number;
    completedAt?: Date;
    createdAt: Date;
}
//# sourceMappingURL=BackupHistory.d.ts.map