import { Request, Response } from 'express';
export declare class DashboardController {
    static getStats(req: Request, res: Response): Promise<void>;
    static getRecentTransactions(req: Request, res: Response): Promise<void>;
    static getSalesChart(req: Request, res: Response): Promise<void>;
    static getCategoryData(req: Request, res: Response): Promise<void>;
    static getMonthlyTrend(req: Request, res: Response): Promise<void>;
    static getAllTransactions(req: Request, res: Response): Promise<void>;
    static getTopCustomers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=DashboardController.d.ts.map