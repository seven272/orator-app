import express from 'express';
import { getDailyTasks} from '../controllers/dailyTaskController.js';

import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get', checkAuth, getDailyTasks)


export default router;