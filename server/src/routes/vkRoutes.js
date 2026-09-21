import { Router } from 'express'
import {
  claimVkBonus,
  updateViralModalTimer,
} from '../controllers/vkController.js'

import {
  checkAuth,
  optionalAuth,
} from '../middlewares/authMiddleware.js'
//middleware авторизации VK
import verifyVkSignature from '../middlewares/vkLaunchParamsAuth.js'

const router = new Router()
// api/vk/claim-bonus
router.post('/claim-bonus', verifyVkSignature, claimVkBonus)
// api/vk/update-modal-timer
router.post(
  '/update-modal-timer',
  verifyVkSignature,
  updateViralModalTimer,
)

export default router
