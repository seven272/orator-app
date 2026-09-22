//хук который рендерить окно фич вконтаке 1 раз в 3 дня, если условия не выполнены
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useVkEnvironment } from './useVkEnvironment'
import {
  openViralModal,
  fetchUpdateViralModalTimer,
} from '../redux/slices/vkSlice'

/**
 * Кастомный хук для автоматического контроля триггеров и кулдауна
 * показа модального окна «Центр виральных наград» в среде ВКонтакте.
 */
export const useViralModalTrigger = () => {
  const dispatch = useDispatch()
  const { isVkEnvironment } = useVkEnvironment()

  // Извлекаем пользователя и статус загрузки профиля из вашего Redux-стейта
  const { user, isVkGuest, isLoading } = useSelector(
    (state) => state.auth,
  )

  // Читаем карту выполненных квестов и метку времени кулдауна из vkSlice
  const { viralBonusesClaimed, lastViralModalShown } = useSelector(
    (state) => state.vk,
  )

  useEffect(() => {
    //  ЗАЩИТА ОТ ГОНКИ СТЕЙТОВ: Ждем, пока профиль гарантированно загрузится с бэкенда
    if (isLoading || !user) return

    // СРЕДА: Проверяем, что пользователь находится внутри экосистемы ВКонтакте
    if (!isVkEnvironment) return

    if (isVkGuest) return

    // UX: Полностью исключаем показ окна для Premium-пользователей (у них безлимитная энергия)
    if (user.isPremium) return

    // 4. КВЕСТЫ: Проверяем, есть ли хотя бы одно невыполненное задание
    const hasUnfinishedTasks = Object.values(
      viralBonusesClaimed,
    ).includes(false)
    if (!hasUnfinishedTasks) return

    // 5. КУЛДАУН: Рассчитываем временной интервал в 3 дня (259 200 000 мс)
    const COOLDOWN_MS = 259200000
    const isCooldownPassed =
      !lastViralModalShown ||
      Date.now() - new Date(lastViralModalShown).getTime() >
        COOLDOWN_MS

    // 6. ЗАПУСК ТРИГГЕРА
    if (isCooldownPassed) {
      // Открываем оверлей-окно квестов
      dispatch(openViralModal())

      // 🤫 ТИХИЙ ФОНОВЫЙ ВЫЗОВ: Сразу обновляем таймер на бэкенде
      dispatch(fetchUpdateViralModalTimer())
    }
  }, [
    isLoading,
    user,
    isVkGuest,
    isVkEnvironment,
    viralBonusesClaimed,
    lastViralModalShown,
    dispatch,
  ])
}
