import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { streamNotifications } from '../controllers/notificationsController';

const router = Router();

router.use(authenticate as any);
router.get('/stream', streamNotifications as any);

export default router;
