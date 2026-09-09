import express from 'express';
import { submitChallengeReport, getChallenges } from '../controllers/challengeController.js';


import { checkAuth, optionalAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/all', optionalAuth, getChallenges);
router.post('/submit-report', checkAuth, submitChallengeReport);

export default router;