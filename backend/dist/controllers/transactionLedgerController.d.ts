import { Request, Response } from 'express';
export declare const transactionLedgerController: {
    getLedger(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getLedgerDetails(req: Request, res: Response): Promise<void>;
    getLedgerSummary(req: Request, res: Response): Promise<void>;
    getCustomerBalance(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=transactionLedgerController.d.ts.map