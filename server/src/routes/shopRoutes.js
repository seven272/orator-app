import express from 'express';
import { getShopItems, buyItem } from '../controllers/shopController.js';


import { checkAuth , optionalAuth} from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get-all-items', optionalAuth, getShopItems);
router.post('/buy-item', checkAuth, buyItem);


export default router;