import { Request, Response, NextFunction } from 'express';

export const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  // 운영환경에서만 HTTPS 강제
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    // 헤더 체크 (로드밸런서나 프록시 뒤에 있는 경우)
    const isHttps = req.secure ||
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
      const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
      return res.redirect(301, httpsUrl);
    }
  }

  next();
};

export const secureHeaders = (req: Request, res: Response, next: NextFunction) => {
  // HTTPS 강제를 위한 보안 헤더
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 기타 보안 헤더
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};