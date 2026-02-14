import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getTransactions, getSummary } from '../controllers/transactionsController';

const router = Router();

router.use(authenticate as any);

router.get('/', getTransactions as any);
router.get('/summary', getSummary as any);

export default router;
