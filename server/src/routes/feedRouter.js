import express from 'express';
import { getFeed, congratulateEvent } from '../controllers/feedController.js';
import { checkAuth, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET /api/feed/all — Получение ленты событий (Доступно гостям через optionalAuth)
router.get('/all', optionalAuth, getFeed);

// POST /api/feed/congratulate/:id — Поставить огонек событию (Строго для авторизованных)
router.post('/congratulate/:id', checkAuth, congratulateEvent);

export default router;
