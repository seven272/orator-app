//хук который рендерить окно фич вконтаке 1 раз в 3 дня, если условия не выполнены
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import bridge from '@vkontakte/vk-bridge'

import { useVkEnvironment } from './useVkEnvironment'
import { openViralModal } from '../redux/slices/vkSlice'

/**
 * Кастомный хук для автоматического контроля триггеров и кулдауна
 * показа модального окна «Центр виральных наград» в среде ВКонтакте.
 */
const useViralModalTrigger = () => {
  const dispatch = useDispatch()
  const { isVkEnvironment } = useVkEnvironment()

  // Запрашиваем состояние авторизации и ВК-квестов
  const { user, isVkGuest, isLoading } = useSelector(
    (state) => state.auth,
  )
  const { viralBonusesClaimed } = useSelector((state) => state.vk)

  useEffect(() => {
    // 1. Проверяем базовые синхронные условия (Не лоадинг, среда ВК, не Premium, не гость ВК) [INDEX]
    if (
      isLoading ||
      !user ||
      !isVkEnvironment ||
      isVkGuest ||
      user.isPremium
    )
      return

    // 2. Выходим, если абсолютно все 4 задания сообщества уже выполнены [INDEX]
    const hasUnfinishedTasks = Object.values(
      viralBonusesClaimed,
    ).includes(false)
    if (!hasUnfinishedTasks) return

    const checkCooldownAndShow = async () => {
      try {
        // 3. Запрашиваем временную метку последнего показа из облачного VK Storage [INDEX]
        const response = await bridge.send('VKWebAppStorageGet', {
          keys: ['govorix_last_viral_shown'],
        })

        const lastShownStr = response.keys?.[0]?.value

        // 3 дня в миллисекундах = 3 * 24 * 60 * 60 * 1000 = 259 200 000
        const COOLDOWN_MS = 259200000
        const isCooldownPassed =
          !lastShownStr ||
          lastShownStr.trim() === '' ||
          Date.now() - parseInt(lastShownStr, 10) > COOLDOWN_MS

        // 4. Запускаем окно, если кулдаун успешно прошел
        if (isCooldownPassed) {
          dispatch(openViralModal())

          // 🔒 Мгновенно фиксируем показ в облаке ВК, блокируя повторные всплывания [INDEX]
          await bridge.send('VKWebAppStorageSet', {
            key: 'govorix_last_viral_shown',
            value: String(Date.now()),
          })
        }
      } catch (error) {
        console.error('Ошибка проверки кулдауна в VK Storage:', error)
      }
    }

    checkCooldownAndShow()
  }, [
    isLoading,
    user,
    isVkGuest,
    isVkEnvironment,
    viralBonusesClaimed,
    dispatch,
  ])
}

export { useViralModalTrigger }
