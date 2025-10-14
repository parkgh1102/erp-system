import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/businesses/:businessId/products', ProductController.create);
router.get('/businesses/:businessId/products', ProductController.getAll);
router.get('/businesses/:businessId/products/:id', ProductController.getById);
router.put('/businesses/:businessId/products/:id', ProductController.update);
router.delete('/businesses/:businessId/products/:id', ProductController.delete);

export default router;