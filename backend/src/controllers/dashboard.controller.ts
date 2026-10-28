import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

export class DashboardController {
  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await DashboardService.getSummary();
      sendSuccess(res, summary, 'Ringkasan dashboard berhasil diambil', 200);
    } catch (error) {
      next(error);
    }
  }
}
