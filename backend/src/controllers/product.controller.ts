import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';
import { sendSuccess } from '../utils/response.js';

export class ProductController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductService.list(req.query as unknown as Parameters<typeof ProductService.list>[0]);
      sendSuccess(res, result.products, 'Data produk berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await ProductService.getById(id);
      sendSuccess(res, product, 'Detail produk berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      sendSuccess(res, product, 'Produk berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await ProductService.update(id, req.body);
      sendSuccess(res, product, 'Produk berhasil diperbarui', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await ProductService.softDelete(id);
      sendSuccess(res, null, 'Produk berhasil dihapus (soft delete)', 200);
    } catch (error) {
      next(error);
    }
  }
}
