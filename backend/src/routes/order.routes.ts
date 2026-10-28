import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  createOrderSchema,
  orderIdParamSchema,
  orderQuerySchema,
} from '../validations/order.validation.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validateRequest({ query: orderQuerySchema }), OrderController.list);
router.get('/:id', validateRequest({ params: orderIdParamSchema }), OrderController.getById);
router.post('/', validateRequest({ body: createOrderSchema }), OrderController.create);

export default router;
