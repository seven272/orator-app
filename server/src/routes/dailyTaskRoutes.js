import express from 'express';
import { getDailyTasks} from '../controllers/dailyTaskController.js';

import { optionalAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get', optionalAuth, getDailyTasks)


export default router;