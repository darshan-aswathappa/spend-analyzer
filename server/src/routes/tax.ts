import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getLocale, upsertLocale, tagTransaction, getAnnualSummary } from '../controllers/taxController';

const router = Router();

router.use(authenticate as any);

router.get('/locale', getLocale as any);
router.put('/locale', upsertLocale as any);
router.patch('/transactions/:id/tag', tagTransaction as any);
router.get('/summary', getAnnualSummary as any);

export default router;
