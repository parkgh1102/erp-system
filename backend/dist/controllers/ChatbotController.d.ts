import { Request, Response } from 'express';
/**
 * 챗봇 메시지 처리
 */
export declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * 챗봇 상태 확인
 */
export declare const getStatus: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=ChatbotController.d.ts.map