// hooks/useLevelUpTrigger.js
import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openLevelUpModal } from '../redux/slices/vkSlice'

// const useLevelUpTrigger = () => {
//   const dispatch = useDispatch()

//   // Извлекаем объект пользователя и статус загрузки из profileSlice (адаптировано под ваш стейт)
//   const { user } = useSelector((state) => state.profile)
//   const { isLoading } = useSelector((state) => state.auth) // Используем флаг загрузки сессии для сэйф-чека

//   // Храним уровень в памяти рефа для вычисления факта изменения в рантайме
//   const previousLevelRef = useRef(null)

//   useEffect(() => {
//     // 🔒 Защита от гонки стейтов: ждем, пока профиль полностью наполнится данными
//     if (isLoading || !user || typeof user.level === 'undefined')
//       return

//     const actualLevel = user.level

//     // 1. Инициализация рефа при первом входе на текущую сессию (без всплывания модалки)
//     if (previousLevelRef.current === null) {
//       previousLevelRef.current = actualLevel
//       return
//     }

//     // Если уровень 1, то не показываем
//     if (actualLevel === 1) {
//       return
//     }

//     // 2. 🚀 РЕАКТИВНЫЙ ДЕТЕКТ LEVEL UP: Уровень стал выше, чем зафиксировано в рефе
//     if (actualLevel > previousLevelRef.current) {
//       const oldLevel = previousLevelRef.current
//       previousLevelRef.current = actualLevel // Сразу перезаписываем, предотвращая дубли

//       // Диспатчим экшен открытия праздничного оверлея
//       dispatch(openLevelUpModal({ newLevel: actualLevel, oldLevel }))
//     }
//   }, [user, isLoading, dispatch])
// }

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
//     if (!user || typeof user.level === 'undefined') {
//     return;
//   }

//     const actualLevel = user.level

//     // 🔒 ИСПРАВЛЕНО: Защита от дефолтных нулей. Уровень оратора не может быть равен 0.
//     if (actualLevel <= 1) {
//       // Но при этом всё равно инициализируем реф, чтобы потом поймать рост
//     if (previousLevelRef.current === null) {
//       previousLevelRef.current = actualLevel;
//     }
//     return;
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
//   }, [user, dispatch])
// }

// const useLevelUpTrigger = () => {
//   const dispatch = useDispatch()

//   const { user, loading: profileLoading } = useSelector(
//     (state) => state.profile,
//   )
//   const { isLoading: authLoading } = useSelector(
//     (state) => state.auth,
//   )

//   const previousLevelRef = useRef(null)

//   useEffect(() => {


//     if (profileLoading || authLoading) return

//     // Базовые защиты: ждём, пока данные точно есть
//     if (!user || typeof user.level === 'undefined') {
//       return
//     }

//     const actualLevel = user.level
//     console.log('actualLevel ' + actualLevel)

//     // Не показываем на уровнях 0, 1 (если это стартовые уровни)
//     if (actualLevel <= 1) {
//       // Всё равно инициализируем реф, чтобы потом поймать рост
//       if (previousLevelRef.current === null) {
//         previousLevelRef.current = actualLevel
//       }
//       return
//     }

//     // Инициализация при первом полноценном проходе: просто запоминаем, не показываем
//     if (previousLevelRef.current === null) {
//       previousLevelRef.current = actualLevel
//       return // <--- самое важное: при первой инициализации модалку НЕ показываем
//     }

//     // Только если уровень реально вырос по сравнению с запомненным — показываем
//     if (actualLevel > previousLevelRef.current) {
//       const oldLevel = previousLevelRef.current
//       previousLevelRef.current = actualLevel // сразу фиксируем, чтобы не дублировать
//       console.log('level-up-check', {
//         actualLevel,
//         previous: previousLevelRef.current,
//         shouldShow: actualLevel > (previousLevelRef.current ?? -1),
//       })

//       dispatch(openLevelUpModal({ newLevel: actualLevel, oldLevel }))
//     }
//   }, [user, dispatch, profileLoading, authLoading]) // достаточно user и dispatch
// }

const useLevelUpTrigger = () => {
  const dispatch = useDispatch()
  
  // Достаем юзера напрямую из profileSlice
  const { user } = useSelector((state) => state.profile)
  
  // Использовать useRef вместо useState — это железный способ заблокировать гонку стейтов
  const previousLevelRef = useRef(null)

  useEffect(() => {
    const apiLevel = user?.level

    // 1. Полностью игнорируем дефолтный нулевой уровень из initialState
    if (!apiLevel || apiLevel <= 0) return

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
      
      console.log(`🎉 LEVEL UP DETECTED: с ${oldLevel} на ${apiLevel}`)
      
      // Открываем праздничное оверлей-окно
      dispatch(openLevelUpModal({ newLevel: apiLevel, oldLevel }))
    }
  }, [user?.level, dispatch]) // В зависимостях только сам уровень, никаких локальных стейтов!
}

export { useLevelUpTrigger }
