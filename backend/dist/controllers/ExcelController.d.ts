import { Request, Response } from 'express';
export declare const generateCustomerTemplate: (req: Request, res: Response) => Promise<void>;
export declare const generateProductTemplate: (req: Request, res: Response) => Promise<void>;
export declare const generateSalesTemplate: (req: Request, res: Response) => Promise<void>;
export declare const generatePurchaseTemplate: (req: Request, res: Response) => Promise<void>;
export declare const generateReceivableTemplate: (req: Request, res: Response) => Promise<void>;
export declare const generatePayableTemplate: (req: Request, res: Response) => Promise<void>;
export declare const uploadCustomers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadProducts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadSales: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadPurchases: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=ExcelController.d.ts.map