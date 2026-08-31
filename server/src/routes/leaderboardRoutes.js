import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';


import { optionalAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get', optionalAuth, getLeaderboard);

export default router;