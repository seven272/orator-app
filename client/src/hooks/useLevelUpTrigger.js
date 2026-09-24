// hooks/useLevelUpTrigger.js
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openLevelUpModal } from '../redux/slices/vkSlice'

const useLevelUpTrigger = () => {
  const dispatch = useDispatch()

  // Достаем юзера напрямую из profileSlice
  const { user } = useSelector((state) => state.profile)

  // Использовать useRef вместо useState — это железный способ заблокировать гонку стейтов
  const previousLevelRef = useRef(null)

  useEffect(() => {
    const apiLevel = user?.level

    // 1. Полностью игнорируем дефолтный нулевой уровень из initialState
    if (!apiLevel || apiLevel <= 1) return

    // 2. ИНИЦИАЛИЗАЦИЯ: При первом запуске просто запоминаем ваш текущий уровень из БД (например, 2)
    if (previousLevelRef.current === null) {
      previousLevelRef.current = apiLevel
      console.log('Level trigger initialized with:', apiLevel)
      return
    }

    // 3. 🚀 ЧИСТЫЙ LEVEL UP: Срабатывает только если новый уровень реально выше сохраненного в памяти рефа
    if (apiLevel > previousLevelRef.current) {
      const oldLevel = previousLevelRef.current
      previousLevelRef.current = apiLevel // Мгновенно обновляем память, блокируя дубликаты [INDEX]

      console.log(
        `🎉 LEVEL UP DETECTED: с ${oldLevel} на ${apiLevel}`,
      )

      // Открываем праздничное оверлей-окно
      dispatch(openLevelUpModal({ newLevel: apiLevel, oldLevel }))
    }
  }, [user?.level, dispatch]) // В зависимостях только сам уровень, никаких локальных стейтов!
}

export { useLevelUpTrigger }
