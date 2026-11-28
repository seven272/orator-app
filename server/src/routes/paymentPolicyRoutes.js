import express from 'express'
import {
  getPaymentPolicy, updatePaymentPolicyAdmin
} from '../controllers/paymentPolicyController.js'
import { checkAuth, checkAdmin } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', getPaymentPolicy)
router.put('/update-rules', checkAuth, checkAdmin, updatePaymentPolicyAdmin)

export default router
