import express from 'express'
import {
  createPaymentYookassa,
  handleWebhookYookassa,
  handleVkPaymentWebhook,
} from '../controllers/paymentController.js'

import { checkAuth } from '../middlewares/authMiddleware.js'
import { verifyVkPaymentSignature } from '../middlewares/vkLaunchParamsAuth.js'

const router = express.Router()

// Создание ссылки на оплату (Для сайтов и разрешенных платформ ВК)
router.post('/create-payment', checkAuth, createPaymentYookassa)
// Вебхук ЮKassa (Должен быть открыт, БЕЗ checkAuth!)
router.post('/webhook/yookassa', handleWebhookYookassa)
// роутер оплаты голосами вконтакте. Сюда бэкенд ВК присылает уведомления get_item и order_status_change. Этот URL прописывается в кабинете разработчика VK Mini Apps
router.post(
  '/webhook/vk',
  verifyVkPaymentSignature,
  handleVkPaymentWebhook,
)

// 2. ФЕЙКОВЫЕ РОУТЫ ДЛЯ РАЗРАБОТКИ (Сохранены по вашей просьбе)
// router.post('/fake-buy-premium', checkAuth, fakeBuyPremium)
// router.post('/fake-buy-course', checkAuth, fakeBuyCourse)

export default router
