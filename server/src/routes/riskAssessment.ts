import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getOnboarding,
  submitOnboarding,
  updateOnboarding,
  getScore,
  getScoreHistory,
} from '../controllers/riskAssessmentController';
import {
  getImpulseScore,
  getCategoryHeatmap,
  getMerchantFlags,
  getPaymentBehavior,
  getVelocityAlerts,
} from '../services/riskInsightsService';

const router = Router();

router.use(authenticate as any);

router.get('/onboarding', getOnboarding as any);
router.post('/onboarding', submitOnboarding as any);
router.put('/onboarding', updateOnboarding as any);
router.get('/score', getScore as any);
router.get('/history', getScoreHistory as any);

router.get('/insights/impulse', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await getImpulseScore(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute impulse score' });
  }
});

router.get('/insights/heatmap', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await getCategoryHeatmap(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute category heatmap' });
  }
});

router.get('/insights/merchants', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await getMerchantFlags(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute merchant flags' });
  }
});

router.get('/insights/payments', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await getPaymentBehavior(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute payment behavior' });
  }
});

router.get('/insights/velocity', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await getVelocityAlerts(userId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to compute velocity alerts' });
  }
});

export default router;
