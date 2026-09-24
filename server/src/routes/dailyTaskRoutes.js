import express from 'express';
import { getDailyTasks,claimWeeklySuperPrize } from '../controllers/dailyTaskController.js';

import { optionalAuth, checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get', optionalAuth, getDailyTasks)
router.post('/claim-superprize', checkAuth, claimWeeklySuperPrize);


export default router;