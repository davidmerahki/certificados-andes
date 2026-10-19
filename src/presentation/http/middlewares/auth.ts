import { Request, Response, NextFunction } from 'express';

export function createAdminAuth(adminApiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key =
      req.header('x-api-key') ??
      req.header('authorization')?.replace(/^Bearer\s+/i, '');

    if (!key || key !== adminApiKey) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' },
      });
      return;
    }
    next();
  };
}
