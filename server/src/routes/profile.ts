import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAccount,
} from '../controllers/profileController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.use(authenticate as any);

router.get('/', getProfile as any);
router.patch('/', updateProfile as any);
router.post('/avatar', upload.single('avatar'), uploadAvatar as any);
router.delete('/', deleteAccount as any);

export default router;
