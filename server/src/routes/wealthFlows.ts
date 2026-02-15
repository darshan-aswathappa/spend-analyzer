import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getFlows,
  createFlow,
  updateFlow,
  deleteFlow,
  getUserSettings,
  saveUserSettings,
} from '../controllers/wealthFlowsController';

const router = Router();

router.use(authenticate as any);

// User-level settings (assets, links, counters) — must come before /:flowId
router.get('/settings', getUserSettings as any);
router.put('/settings', saveUserSettings as any);

// Flow CRUD
router.get('/', getFlows as any);
router.post('/', createFlow as any);
router.put('/:flowId', updateFlow as any);
router.delete('/:flowId', deleteFlow as any);

export default router;
