import { Router } from 'express';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  searchEmailsRoute,
  deleteEmailJob,
  getSenders,
} from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/search', searchEmailsRoute);
router.delete('/:id', deleteEmailJob);
router.get('/senders/all', getSenders);

export default router;
