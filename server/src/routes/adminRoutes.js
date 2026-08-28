import express from 'express'
import {
  getStatistics,
  getUserList,
  togglePremiumUser,
  deleteUser,
  getMerchOrders,
  toggleStatusMerch,
} from '../controllers/adminController.js'

import {
  checkAuth,
  checkAdmin,
} from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/statistics', checkAuth, getStatistics)
router.get('/user-list', checkAuth, getUserList)
router.get('/merch-orders', getMerchOrders)
router.post('/toggle-premium/:id', checkAuth, togglePremiumUser)
router.delete('/delete-user/:id', checkAuth, deleteUser)
router.patch(
  '/toggle-status-merch/:orderId',
  checkAuth,
  toggleStatusMerch,
)

export default router
