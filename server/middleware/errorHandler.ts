import { Request, Response, NextFunction } from 'express';

/**
 * Global API Error Handling Middleware
 * 
 * Catches unhandled errors thrown during request processing and returns
 * a standard, structured JSON response.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[API ERROR]', err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    timestamp: new Date().toISOString()
  });
}
