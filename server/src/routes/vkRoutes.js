import { Router } from 'express'
import {
  claimVkBonus,
 
} from '../controllers/vkController.js'

//middleware авторизации VK
import verifyVkSignature from '../middlewares/vkLaunchParamsAuth.js'

const router = new Router()
// api/vk/claim-bonus
router.post('/claim-bonus', verifyVkSignature, claimVkBonus)


export default router
