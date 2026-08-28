import express from 'express';
import { getShopItems, buyItem } from '../controllers/shopController.js';


import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.get('/get-all-items', checkAuth, getShopItems);
router.post('/buy-item', checkAuth, buyItem);


export default router;