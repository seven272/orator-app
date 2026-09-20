import { useMemo } from 'react'

export const useVkEnvironment = () => {
  return useMemo(() => {
    // Проверяем наличие VK Bridge или специфических query-параметров ВК в URL
    const searchParams = new URLSearchParams(window.location.search)
    const isVkApp =
      searchParams.has('vk_app_id') ||
      searchParams.has('vk_viewer_id')
    const isBridgeAvailable =
      typeof window !== 'undefined' && !!window.vkBridge

    return isVkApp || isBridgeAvailable
  }, [])
}
