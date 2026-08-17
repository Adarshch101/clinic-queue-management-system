import { NextResponse } from 'next/server';
import { AppError } from './AppError';

type ApiHandler = (request: Request, ...args: unknown[]) => Promise<Response> | Response;

export function withErrorHandler(handler: ApiHandler) {
  return async (request: Request, ...args: unknown[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('[API Error]:', error);

      const timestamp = new Date().toISOString();
      const meta = { timestamp, version: '1.0.0' };

      if (error instanceof AppError) {
        return NextResponse.json({
          success: false,
          message: error.message,
          errors: error.errors,
          meta
        }, { status: error.statusCode });
      }

      // Handle standard Zod validation or Prisma exceptions
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({
          success: false,
          message: 'Validation failed',
          errors: (error as { errors?: unknown }).errors || [],
          meta
        }, { status: 400 });
      }

      const message = error instanceof Error ? (error.message || 'Internal Server Error') : 'Internal Server Error';
      return NextResponse.json({
        success: false,
        message,
        meta
      }, { status: 500 });
    }
  };
}
