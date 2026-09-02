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

router.get('/statistics', checkAuth, checkAdmin, getStatistics)
router.get('/user-list', checkAuth, checkAdmin, getUserList)
router.get('/merch-orders', getMerchOrders)
router.post('/toggle-premium/:id', checkAuth,checkAdmin, togglePremiumUser)
router.delete('/delete-user/:id', checkAuth, checkAdmin, deleteUser)
router.patch(
  '/toggle-status-merch/:orderId',
  checkAuth,
  checkAdmin,
  toggleStatusMerch,
)

export default router
