import { Request, Response } from 'express';
export declare const UserController: {
    getUsers(req: Request, res: Response): Promise<void>;
    createUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    toggleUserStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=UserController.d.ts.map