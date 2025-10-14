import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/businesses/:businessId/customers', CustomerController.create);
router.get('/businesses/:businessId/customers', CustomerController.getAll);
router.get('/businesses/:businessId/customers/:id', CustomerController.getById);
router.put('/businesses/:businessId/customers/:id', CustomerController.update);
router.delete('/businesses/:businessId/customers/:id', CustomerController.delete);

export default router;