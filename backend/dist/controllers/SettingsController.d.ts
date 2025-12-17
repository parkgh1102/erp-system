import { Request, Response } from 'express';
export declare const SettingsController: {
    getSecuritySettingsByEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSettings(req: Request, res: Response): Promise<void>;
    updateSettings(req: Request, res: Response): Promise<void>;
    exportCustomers(req: Request, res: Response): Promise<void>;
    exportProducts(req: Request, res: Response): Promise<void>;
    exportTransactions(req: Request, res: Response): Promise<void>;
    exportAll(req: Request, res: Response): Promise<void>;
    resetAllData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    backupData(req: Request, res: Response): Promise<void>;
    restoreData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteAccount(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=SettingsController.d.ts.map