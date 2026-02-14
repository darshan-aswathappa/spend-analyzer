import { Router } from 'express';
import statementsRouter from './statements';
import transactionsRouter from './transactions';
import chatRouter from './chat';
import notificationsRouter from './notifications';
import reportsRouter from './reports';
import riskAssessmentRouter from './riskAssessment';
import demoRouter from './demo';

const router = Router();

router.use('/statements', statementsRouter);
router.use('/transactions', transactionsRouter);
router.use('/chat', chatRouter);
router.use('/notifications', notificationsRouter);
router.use('/reports', reportsRouter);
router.use('/risk-assessment', riskAssessmentRouter);
router.use('/demo', demoRouter);

export default router;
