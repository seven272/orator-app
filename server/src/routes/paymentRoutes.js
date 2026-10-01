import express from 'express'
import {
  createPaymentYookassa,
  handleWebhookYookassa,
  checkOrderStatus, 
  //   fakeBuyPremium,
  //   fakeBuyCourse,
} from '../controllers/paymentController.js'

import { checkAuth } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Создание ссылки на оплату (Для сайтов и разрешенных платформ ВК)
router.post('/create-payment', checkAuth, createPaymentYookassa)
// Вебхук ЮKassa (Должен быть открыт, БЕЗ checkAuth!)
router.post('/webhook/yookassa', handleWebhookYookassa)
// проверка статуса платежа
router.get('/order-status/:orderId', checkAuth, checkOrderStatus)

// 2. ФЕЙКОВЫЕ РОУТЫ ДЛЯ РАЗРАБОТКИ (Сохранены по вашей просьбе)
// router.post('/fake-buy-premium', checkAuth, fakeBuyPremium)
// router.post('/fake-buy-course', checkAuth, fakeBuyCourse)

export default router
