import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getMonthlyReport } from '../controllers/reportsController';

const router = Router();

router.use(authenticate as any);

router.get('/monthly', getMonthlyReport as any);

export default router;
