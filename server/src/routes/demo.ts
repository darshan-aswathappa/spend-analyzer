import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { seedDemoData } from '../controllers/demoController';

const router = Router();

router.use(authenticate as any);

router.post('/seed', seedDemoData as any);

export default router;
