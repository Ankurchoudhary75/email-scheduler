import { Router } from 'express';
import {
  getSlackAuthUrl,
  slackOAuthCallback,
  saveSlackWebhook,
  getSlackStatus,
  disconnectSlack,
} from '../controllers/slackController';

const router = Router();

router.get('/url', getSlackAuthUrl);
router.get('/callback', slackOAuthCallback);
router.post('/webhook', saveSlackWebhook);
router.get('/status', getSlackStatus);
router.post('/disconnect', disconnectSlack);

export default router;
