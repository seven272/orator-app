import PaymentPolicy from '../models/PaymentPolicy.js'

const DEFAULT_RULES = {
  web: 'yookassa',
  vk_web: 'yookassa',
  vk_native_mobile: 'vk_votes',
  telegram: 'info_only',
  rustore: 'info_only',
}

// 1. Получить публичный конфиг приложения (доступно всем без авторизации)
const getPaymentPolicy = async (req, res) => {
  try {
    let settings = await PaymentPolicy.findOne({ key: 'global_config' })

    if (!settings) {
      settings = await PaymentPolicy.create({
        key: 'global_config',
        paymentRules: DEFAULT_RULES,
      })
    }

    return res.status(200).json({
      success: true,
      paymentRules: settings.paymentRules,
    })
  } catch (error) {
    console.error('Ошибка загрузки конфига приложения:', error)
    // Даже при сбое БД отдаем безопасный фолбэк, чтобы фронтенд не падал
    return res.status(200).json({
      success: true,
      paymentRules: DEFAULT_RULES,
    })
  }
}

// 2. [ADMIN] Обновить правила оплаты по платформам
const updatePaymentPolicyAdmin = async (req, res) => {
  try {
    const { paymentRules } = req.body

    if (!paymentRules || typeof paymentRules !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат настроек оплаты',
      })
    }

    let settings = await PaymentPolicy.findOne({ key: 'global_config' })
    if (!settings) {
      settings = new PaymentPolicy({ key: 'global_config' })
    }

    settings.paymentRules = {
      ...DEFAULT_RULES,
      ...settings.paymentRules.toObject(),
      ...paymentRules,
    }

    await settings.save()

    return res.status(200).json({
      success: true,
      message: 'Настройки оплаты успешно обновлены',
      paymentRules: settings.paymentRules,
    })
  } catch (error) {
    console.error('Ошибка обновления правил оплаты:', error)
    return res.status(500).json({
      success: false,
      message: 'Не удалось сохранить настройки оплаты',
    })
  }
}

export {getPaymentPolicy, updatePaymentPolicyAdmin}
