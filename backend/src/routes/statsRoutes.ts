import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';

const router = Router();

router.get('/', getDashboardStats);

export default router;
