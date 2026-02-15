import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/authenticate';
import {
  uploadStatement,
  getStatements,
  deleteStatement,
  setDefaultStatement,
  viewStatementPdf,
} from '../controllers/statementsController';
import { AuthenticatedRequest } from '../types';

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

router.use(authenticate as any);

router.get('/', getStatements as any);
router.post('/upload', upload.single('statement'), uploadStatement as any);
router.get('/:id/pdf', viewStatementPdf as any);
router.patch('/:id/set-default', setDefaultStatement as any);
router.delete('/:id', deleteStatement as any);

export default router;
