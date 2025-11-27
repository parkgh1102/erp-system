import { Request, Response } from 'express';
export declare const SettingsController: {
    getSecuritySettingsByEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSettings(req: Request, res: Response): Promise<void>;
    updateSettings(req: Request, res: Response): Promise<void>;
    exportCustomers(req: Request, res: Response): Promise<void>;
    exportProducts(req: Request, res: Response): Promise<void>;
    exportTransactions(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=SettingsController.d.ts.map