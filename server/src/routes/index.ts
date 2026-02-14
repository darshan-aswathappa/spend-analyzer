import { Router } from 'express';
import statementsRouter from './statements';
import transactionsRouter from './transactions';
import chatRouter from './chat';

const router = Router();

router.use('/statements', statementsRouter);
router.use('/transactions', transactionsRouter);
router.use('/chat', chatRouter);

export default router;
