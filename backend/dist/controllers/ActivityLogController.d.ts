import { Request, Response } from 'express';
export declare class ActivityLogController {
    private activityLogRepository;
    private userRepository;
    createLog(req: Request, res: Response): Promise<Response>;
    getUserLogs(req: Request, res: Response): Promise<Response>;
    getRecentLogs(req: Request, res: Response): Promise<Response>;
    getBusinessLogs(req: Request, res: Response): Promise<Response>;
    deleteLog(req: Request, res: Response): Promise<Response>;
}
export declare const logActivity: (actionType: string, entity: string, entityId: number | undefined, description: string, req: Request, metadata?: any) => Promise<void>;
//# sourceMappingURL=ActivityLogController.d.ts.map