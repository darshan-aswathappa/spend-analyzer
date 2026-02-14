import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getOnboarding,
  submitOnboarding,
  updateOnboarding,
  getScore,
  getScoreHistory,
} from '../controllers/riskAssessmentController';

const router = Router();

router.use(authenticate as any);

router.get('/onboarding', getOnboarding as any);
router.post('/onboarding', submitOnboarding as any);
router.put('/onboarding', updateOnboarding as any);
router.get('/score', getScore as any);
router.get('/history', getScoreHistory as any);

export default router;
