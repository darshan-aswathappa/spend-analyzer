import { Router } from 'express';
import statementsRouter from './statements';
import transactionsRouter from './transactions';
import chatRouter from './chat';
import notificationsRouter from './notifications';
import reportsRouter from './reports';

const router = Router();

router.use('/statements', statementsRouter);
router.use('/transactions', transactionsRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationsRouter);
router.use('/reports', reportsRouter);

export default router;
