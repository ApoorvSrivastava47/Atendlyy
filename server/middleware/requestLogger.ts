import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 * 
 * Logs all incoming REST API requests with HTTP method, path, and response time.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
}
