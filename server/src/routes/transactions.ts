import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getTransactions, getSummary, getTrends, getProjections } from '../controllers/transactionsController';

const router = Router();

router.use(authenticate as any);

router.get('/', getTransactions as any);
router.get('/summary', getSummary as any);
router.get('/trends', getTrends as any);
router.get('/projections', getProjections as any);

export default router;
