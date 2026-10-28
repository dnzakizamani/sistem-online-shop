import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from '../validations/customer.validation.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validateRequest({ query: customerQuerySchema }), CustomerController.list);
router.get('/:id', validateRequest({ params: customerIdParamSchema }), CustomerController.getById);
router.post('/', validateRequest({ body: createCustomerSchema }), CustomerController.create);
router.put(
  '/:id',
  validateRequest({ params: customerIdParamSchema, body: updateCustomerSchema }),
  CustomerController.update
);
router.delete(
  '/:id',
  validateRequest({ params: customerIdParamSchema }),
  CustomerController.delete
);

export default router;
