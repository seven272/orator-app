import { useMemo } from 'react'

/**
 * Хук для детального определения среды ВКонтакте и конкретной платформы запуска
 * @returns {Object} { isVkEnvironment: boolean, isVkMobile: boolean, vkPlatform: string | null }
 */
const useVkEnvironment = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isVkEnvironment: false,
        isVkMobile: false,
        vkPlatform: null,
      }
    }

    // 1. Извлекаем query-параметры из текущего URL запуска мини-приложения
    const searchParams = new URLSearchParams(window.location.search)
    const vkAppId = searchParams.get('vk_app_id')
    const vkPlatformParam = searchParams.get('vk_platform')

    // Глобальная проверка: открыто ли приложение в экосистеме ВК
    const isVkEnvironment = !!(
      vkAppId ||
      window.vkBridge ||
      searchParams.has('vk_viewer_id')
    )

    // 2. Определяем конкретную платформу
    // Если параметра в URL нет (например, локальная разработка), но bridge доступен, страхуемся дефолтом
    let vkPlatform = null
    if (isVkEnvironment) {
      vkPlatform = vkPlatformParam || 'unknown'
    }

    // 3. Классифицируем мобильные платформы на основе официальных констант VK Bridge [INDEX]
    // mobile_android - Приложение на Android
    // mobile_iphone  - Приложение на iOS
    // mobile_web     - Мобильная версия сайта ://vk.com в браузере смартфона
    const mobilePlatforms = [
      'mobile_android',
      'mobile_iphone',
      'mobile_web',
    ]
    const isVkMobile =
      isVkEnvironment && mobilePlatforms.includes(vkPlatform)

    return {
      isVkEnvironment,
      isVkMobile,
      vkPlatform,
    }
  }, [])
}

export { useVkEnvironment }
