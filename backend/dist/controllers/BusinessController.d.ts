import { Request, Response } from 'express';
export declare class BusinessController {
    static getAll(req: Request, res: Response): Promise<void>;
    static getById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static update(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static delete(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static validateBusinessNumber(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=BusinessController.d.ts.map