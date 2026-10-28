import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import { sendSuccess } from '../utils/response.js';

export class OrderController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrderService.list(req.query as unknown as Parameters<typeof OrderService.list>[0]);
      sendSuccess(res, result.orders, 'Data pesanan berhasil diambil', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await OrderService.getById(id);
      sendSuccess(res, order, 'Detail pesanan berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const order = await OrderService.create(req.body, userId);
      sendSuccess(res, order, 'Pesanan berhasil dibuat', 201);
    } catch (error) {
      next(error);
    }
  }
}
