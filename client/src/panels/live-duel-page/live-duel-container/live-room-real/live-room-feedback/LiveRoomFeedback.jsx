import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle } from 'react-icons/fi'
import {
  fetchCheckRatingStatus,
  fetchSubmitLiveRating,
} from '../../../../../redux/slices/liveDuelSlice'
import styles from './LiveRoomFeedback.module.css'

// 1. Добавляем проп onVoteSuccess в аргументы компонента
const LiveRoomFeedback = ({
  roomId,

  currentRoom,
  onVoteSuccess,
}) => {
  const dispatch = useDispatch()
  const { opponentRating, isRatingSubmitted, loading } = useSelector(
    (state) => state.liveDuel,
  )

  const [isVoted, setIsVoted] = useState(false)
  const [isOpponentLeaved, setIsOpponentLeaved] = useState(false)

  const pollingInterval = useRef(null)
  const timeoutId = useRef(null)

//   useEffect(() => {
//     if (isRatingSubmitted && roomId) {
//       pollingInterval.current = setInterval(() => {
//         dispatch(fetchCheckRatingStatus(roomId))
//       }, 2500)

//       timeoutId.current = setTimeout(() => {
//         clearInterval(pollingInterval.current)
//         setIsOpponentLeaved(true)
//       }, 15000)
//     }

//     if (opponentRating !== null) {
//       clearInterval(pollingInterval.current)
//       clearTimeout(timeoutId.current)
//     }

//     return () => {
//       clearInterval(pollingInterval.current)
//       clearTimeout(timeoutId.current)
//     }
//   }, [isRatingSubmitted, opponentRating, roomId, dispatch])

  // 2. Исправленный метод отправки голоса
  

  // === ВНУТРИ live-room-feedback/LiveRoomFeedback.jsx ===



  





//TEST START
useEffect(() => {
  if (isRatingSubmitted && roomId) {
    console.log(`%c[QA TEST] Наша оценка отправлена. Запуск интервала пуллинга оценок оппонента для комнаты: ${roomId}`, 'color: #007aff;');
    
    pollingInterval.current = setInterval(() => {
      console.log('%c[QA TEST] Пуллинг... Запрос статуса оценок эндпоинтом checkRatingStatus', 'color: #8e9bae;');
      
      dispatch(fetchCheckRatingStatus(roomId))
        .unwrap()
        .then((res) => {
          console.log('%c[QA TEST] Результат пуллинга оценок от сервера:', 'color: #007aff;', res?.data);
        })
        .catch((pollErr) => {
          console.error('%c[QA TEST] Ошибка пуллинга в интервале:', 'color: #f30404;', pollErr);
        });
    }, 2500);

    timeoutId.current = setTimeout(() => {
      console.warn('%c[QA TEST] Внимание: Вышел 15-секундный таймаут ожидания оппонента.', 'color: #ffbd12;');
      clearInterval(pollingInterval.current);
      setIsOpponentLeaved(true); 
    }, 15000);
  }

  if (opponentRating !== null) {
    console.log(`%c[QA TEST] УСПЕХ: Оценка от оппонента получена (${opponentRating}). Зачищаем таймеры пуллинга.`, 'color: #34c759; font-weight: bold;');
    clearInterval(pollingInterval.current);
    clearTimeout(timeoutId.current);
  }

  return () => {
    clearInterval(pollingInterval.current);
    clearTimeout(timeoutId.current);
  };
}, [isRatingSubmitted, opponentRating, roomId, dispatch]);
//TEST FINISH
  
  
  
  const handleVoteSubmit = (rating) => {
    if (!roomId) return
    setIsVoted(true)
    

    dispatch(fetchSubmitLiveRating({ roomId, rating }))
      .unwrap()
      .then((data) => {
        // Передаем все данные награды наверх в LiveRoomReal
        onVoteSuccess({
          rating,
          earnedXp: data.earnedXp,
          earnedCoins: data.earnedCoins,
          isLevelUp: data.isLevelUp,
          newLevel: data.stats?.level,
          achievements: data.newAchievements || [],
        })
      })
      .catch((err) => {
        alert(`Ошибка при сохранении результатов: ${err}`)
        setIsVoted(false)
      })
  }

  // 3. Упрощаем JSX: если мы проголосовали, показываем только статус ожидания оппонента.
  // Как только оппонент ответит (или выйдет таймаут), родитель сам откроет модалку наград!
  return (
    <div className={styles.feedback_block}>
      {!isVoted ? (
        <>
          <h3 className={styles.feedback_title}>
            Как справился ваш оппонент?
          </h3>
          <p className={styles.feedback_description}>
            Оцените структуру аргументов, уверенность речи и навыки
            контратакования.
          </p>
          <div className={styles.rating_buttons}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                className={styles.rating_btn}
                onClick={() => handleVoteSubmit(num)}
                disabled={loading}
              >
                {num}
              </button>
            ))}
          </div>
          <button
            className={styles.skip_btn}
            onClick={() => handleVoteSubmit(null)}
            disabled={loading}
          >
            Пропустить оценку
          </button>
        </>
      ) : (
        <div className={styles.success_vote}>
          <div className={styles.loader_box}>
            {opponentRating === null && !isOpponentLeaved ? (
              <>
                <div className={styles.spinner}></div>
                <p>Ожидаем решение второго оратора...</p>
              </>
            ) : (
              <>
                <FiCheckCircle
                  size={44}
                  className={styles.success_check_icon}
                />
                <div className={styles.opponent_rating_info}>
                  {isOpponentLeaved ? (
                    <p className={styles.muted_text}>
                      Оппонент завершил сессию. Ваши награды
                      рассчитаны!
                    </p>
                  ) : (
                    <p className={styles.muted_text}>
                      Оппонент успешно выставил вам встречную оценку.
                      Сессия синхронизирована!
                    </p>
                  )}
                </div>
                {/* Кнопка теперь сразу триггерит открытие итоговой премиум модалки */}
                <button
                  className={styles.leave_room_btn}
                  onClick={() =>
                    onVoteSuccess({
                      rating: currentRoom?.ratingFromA || 5, // фолбэк для безопасности
                      earnedXp: currentRoom?.pointsEarnedA || 150,
                      earnedCoins: 15,
                      isLevelUp: false,
                      newLevel: 1,
                      achievements: [],
                    })
                  }
                >
                  Посмотреть мои награды
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveRoomFeedback
