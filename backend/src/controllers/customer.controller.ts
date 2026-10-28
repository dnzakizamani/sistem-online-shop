import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service.js';
import { sendSuccess } from '../utils/response.js';

export class CustomerController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CustomerService.list(req.query as unknown as Parameters<typeof CustomerService.list>[0]);
      sendSuccess(res, result.customers, 'Data pelanggan berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.getById(req.params.id);
      sendSuccess(res, customer, 'Detail pelanggan berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.create(req.body);
      sendSuccess(res, customer, 'Pelanggan berhasil ditambahkan', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomerService.update(req.params.id, req.body);
      sendSuccess(res, customer, 'Pelanggan berhasil diperbarui', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CustomerService.softDelete(req.params.id);
      sendSuccess(res, null, 'Pelanggan berhasil dihapus (soft delete)', 200);
    } catch (error) {
      next(error);
    }
  }
}
