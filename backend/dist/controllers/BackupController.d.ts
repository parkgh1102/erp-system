import { Request, Response } from 'express';
export declare class BackupController {
    static getConfig(req: Request, res: Response): Promise<void>;
    static updateConfig(req: Request, res: Response): Promise<void>;
    static getHistory(req: Request, res: Response): Promise<void>;
    static createBackup(req: Request, res: Response): Promise<void>;
    static restoreBackup(req: Request, res: Response): Promise<void>;
    static downloadBackup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteBackup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
export default BackupController;
//# sourceMappingURL=BackupController.d.ts.map