import { Request, Response, NextFunction } from 'express';
import {
  DomainError,
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { ILogger } from '../../../domain/ports/ILogger';

export function createErrorHandler(logger: ILogger) {
  return (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    if (err instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    if (err instanceof ConflictError) {
      res.status(409).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    if (err instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }
    if (err instanceof DomainError) {
      res.status(422).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
      return;
    }

    const message = err instanceof Error ? err.message : 'Internal server error';
    logger.error('Unhandled error', { error: message });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    });
  };
}
