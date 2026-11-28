import { useMemo } from 'react'

/**
 * Хук для детального определения среды запуска приложения и конкретной платформы
 * Поддерживает: независимый сайт (Web), VK Desktop, VK Mobile Web, нативные клиенты VK (iOS/Android), Telegram и RuStore
 * @returns {Object} {
 *   isVkEnvironment: boolean,   // Запущено ли приложение внутри экосистемы ВКонтакте
 *   isVkMobile: boolean,        // Любая мобильная среда ВК (включая мобильный браузер mobile_web)
 *   isVkNativeMobile: boolean,  // Строго нативные приложения ВК (iOS / Android), где действуют жесткие правила сторов
 *   vkPlatform: string | null,  // Сырое значение параметра vk_platform из URL запуска
 *   platformKey: string         // Единый ключ среды для матрицы PaymentPolicy ('web' | 'vk_web' | 'vk_native_mobile' | 'telegram' | 'rustore')
 * }
 */
const useVkEnvironment = () => {
  return useMemo(() => {
    // Защита при SSR или запуске вне браузерного окружения
    if (typeof window === 'undefined') {
      return {
        isVkEnvironment: false,
        isVkMobile: false,
        isVkNativeMobile: false,
        vkPlatform: null,
        platformKey: 'web',
      }
    }

    // 1. Извлекаем query-параметры из текущего URL запуска мини-приложения
    const searchParams = new URLSearchParams(window.location.search)
    const vkAppId = searchParams.get('vk_app_id')
    const vkPlatformParam = searchParams.get('vk_platform')

    // Глобальная проверка: открыто ли приложение в экосистеме ВК
    const isVkEnvironment = Boolean(
      vkAppId || window.vkBridge || searchParams.has('vk_viewer_id'),
    )

    // 2. Определяем конкретную платформу ВКонтакте
    // Если параметра в URL нет (например, локальная разработка), но bridge доступен, страхуемся дефолтом 'unknown'
    let vkPlatform = null
    if (isVkEnvironment) {
      vkPlatform = vkPlatformParam || 'unknown'
    }

    // 3. Классифицируем все мобильные платформы ВК на основе официальных констант VK Bridge:
    // mobile_android - Нативное приложение ВК на Android
    // mobile_iphone  - Нативное приложение ВК на iPhone
    // mobile_ipad    - Нативное приложение ВК на iPad
    // mobile_web     - Мобильная версия сайта ://vk.com в обычном браузере смартфона
    const allVkMobilePlatforms = [
      'mobile_android',
      'mobile_iphone',
      'mobile_ipad',
      'mobile_web',
    ]
    const isVkMobile =
      isVkEnvironment && allVkMobilePlatforms.includes(vkPlatform)

    // 4. Выделяем строго нативные мобильные клиенты ВК (App Store / Google Play)
    // В отличие от mobile_web, здесь модераторы жестко запрещают сторонние платежи (ЮKassa) для цифровых товаров
    const nativeVkMobilePlatforms = [
      'mobile_android',
      'mobile_iphone',
      'mobile_ipad',
    ]
    const isVkNativeMobile =
      isVkEnvironment && nativeVkMobilePlatforms.includes(vkPlatform)

    // 5. Вычисляем итоговый ключ платформы для единой матрицы правил оплаты (PaymentPolicy)
    let platformKey = 'web'

    if (isVkEnvironment) {
      // Разделяем нативные приложения ВК и веб-версию ВК (десктоп + мобильный браузер)
      platformKey = isVkNativeMobile ? 'vk_native_mobile' : 'vk_web'
    } else if (window.Telegram?.WebApp?.initData) {
      // Приложение открыто внутри Telegram Mini Apps
      platformKey = 'telegram'
    } else if (
      searchParams.get('platform') === 'rustore' ||
      Boolean(window.RuStorePay)
    ) {
      // Сборка или обёртка для магазина RuStore
      platformKey = 'rustore'
    }

    return {
      isVkEnvironment,
      isVkMobile,
      isVkNativeMobile,
      vkPlatform,
      platformKey,
    }
  }, [])
}

export { useVkEnvironment }
