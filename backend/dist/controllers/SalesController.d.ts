import { Request, Response } from 'express';
export declare class SalesController {
    static getAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static delete(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static signSales(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static uploadStatement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static sendAlimtalk(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=SalesController.d.ts.map