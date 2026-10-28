import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError, sendError } from '../utils/response.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Handle Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
      sendError(res, `Data dengan ${target} tersebut sudah digunakan`, 409, {
        [target]: [`${target} sudah terdaftar di sistem`],
      });
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Data yang diminta tidak ditemukan', 404);
      return;
    }
  }

  // Handle general errors
  console.error('[Unhandled Error]:', err);
  const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal pada server';
  sendError(res, message, 500);
};
