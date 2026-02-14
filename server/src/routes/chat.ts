import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { chat, getChatHistory, clearChatHistory } from '../controllers/chatController';

const router = Router();

router.use(authenticate as any);

router.post('/', chat as any);
router.get('/history', getChatHistory as any);
router.delete('/history', clearChatHistory as any);

export default router;
