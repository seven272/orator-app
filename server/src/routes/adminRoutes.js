import express from 'express'
import {
  getStatistics,
  getUserList,
  updatePremiumUserAdmin,
  addCourseToUserAdmin,
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
router.post(
  '/add-course/:id',
  checkAuth,
  checkAdmin,
  addCourseToUserAdmin,
)
router.post(
  '/update-premium/:id',
  checkAuth,
  checkAdmin,
  updatePremiumUserAdmin,
)
router.get('/merch-orders', checkAuth, checkAdmin, getMerchOrders)
router.delete('/delete-user/:id', checkAuth, checkAdmin, deleteUser)
router.patch(
  '/toggle-status-merch/:orderId',
  checkAuth,
  checkAdmin,
  toggleStatusMerch,
)

export default router
