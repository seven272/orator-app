import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';


import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get', checkAuth, getLeaderboard);

export default router;