import { Router } from 'express';
import { googleLogin, getProfile } from '../controllers/authController';

const router = Router();

router.post('/google-login', googleLogin);
router.get('/profile', getProfile);

export default router;
