import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validate.js';
import {
  createProductSchema,
  productIdParamSchema,
  productQuerySchema,
  updateProductSchema,
} from '../validations/product.validation.js';

const router = Router();

router.use(authenticateToken);

router.get('/', validateRequest({ query: productQuerySchema }), ProductController.list);
router.get('/:id', validateRequest({ params: productIdParamSchema }), ProductController.getById);
router.post('/', validateRequest({ body: createProductSchema }), ProductController.create);
router.put(
  '/:id',
  validateRequest({ params: productIdParamSchema, body: updateProductSchema }),
  ProductController.update
);
router.delete('/:id', validateRequest({ params: productIdParamSchema }), ProductController.delete);

export default router;
