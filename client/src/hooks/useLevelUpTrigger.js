// hooks/useLevelUpTrigger.js
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openLevelUpModal } from '../redux/slices/vkSlice'

const useLevelUpTrigger = () => {
  const dispatch = useDispatch()

  // Извлекаем объект пользователя и статус загрузки из profileSlice (адаптировано под ваш стейт)
  const { user } = useSelector((state) => state.profile)
  const { isLoading } = useSelector((state) => state.auth) // Используем флаг загрузки сессии для сэйф-чека

  // Храним уровень в памяти рефа для вычисления факта изменения в рантайме
  const previousLevelRef = useRef(null)

  useEffect(() => {
    // 🔒 Защита от гонки стейтов: ждем, пока профиль полностью наполнится данными
    if (isLoading || !user || typeof user.level === 'undefined')
      return

    const actualLevel = user.level

    // 1. Инициализация рефа при первом входе на текущую сессию (без всплывания модалки)
    if (previousLevelRef.current === null) {
      previousLevelRef.current = actualLevel
      return
    }

    // Если уровень 1, то не показываем
    if (actualLevel === 1) {
      return
    }

    // 2. 🚀 РЕАКТИВНЫЙ ДЕТЕКТ LEVEL UP: Уровень стал выше, чем зафиксировано в рефе
    if (actualLevel > previousLevelRef.current) {
      const oldLevel = previousLevelRef.current
      previousLevelRef.current = actualLevel // Сразу перезаписываем, предотвращая дубли

      // Диспатчим экшен открытия праздничного оверлея
      dispatch(openLevelUpModal({ newLevel: actualLevel, oldLevel }))
    }
  }, [user, isLoading, dispatch])
}

// const useLevelUpTrigger = () => {
//   const dispatch = useDispatch()

//   // 1. Извлекаем данные профиля и его личный статус загрузки!
//   const { user, loading: profileLoading } = useSelector(
//     (state) => state.profile,
//   )
//   const { isLoading: authLoading } = useSelector(
//     (state) => state.auth,
//   )

//   const previousLevelRef = useRef(null)

//   useEffect(() => {
//     // 🔒 ИСПРАВЛЕНО: Ждем, пока ЗАВЕРШИТСЯ фоновый fetchProfileData (status === 'succeeded')
//     // Это полностью защищает от гонки данных между authSlice и profileSlice
//     if (
//       authLoading ||
//       profileLoading ||
//       !user ||
//       !user.level ||
//       user.level <= 0
//     )
//       return

//     const actualLevel = user.level

//     // 🔒 ИСПРАВЛЕНО: Защита от дефолтных нулей. Уровень оратора не может быть равен 0.
//     if (actualLevel <= 0) return

//     // Если уровень 1, то не показываем
//     if (actualLevel === 1) {
//       return
//     }

//     // 2. Инициализация рефа при первом полноценном входе
//     if (previousLevelRef.current === null) {
//       previousLevelRef.current = actualLevel
//       return
//     }

//     // 3. 🚀 НАСТОЯЩИЙ LEVEL UP: Уровень действительно вырос в процессе игры
//     if (actualLevel > previousLevelRef.current) {
//       const oldLevel = previousLevelRef.current
//       previousLevelRef.current = actualLevel // Сразу фиксируем, убирая дубли

//       dispatch(openLevelUpModal({ newLevel: actualLevel, oldLevel }))
//     }
//   }, [authLoading, profileLoading, user, dispatch]) // Добавили status в зависимости
// }

export { useLevelUpTrigger }
