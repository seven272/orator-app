import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle } from 'react-icons/fi'
import { fetchCheckRatingStatus, fetchSubmitLiveRating, resetLiveDuelState } from '../../../../../redux/slices/liveDuelSlice'
import LiveRoomRewardModal from '../live-room-reward-modal/LiveRoomRewardModal' // 🚀 Импортируем модалку сюда
import styles from './LiveRoomFeedback.module.css'

const LiveRoomFeedback = ({ roomId, currentRoom }) => {
  const dispatch = useDispatch()
  
  // 🚀 Вытаскиваем всё нужное напрямую из Redux-слайса
  const { opponentRating, isRatingSubmitted, loading } = useSelector((state) => state.liveDuel)

  const [isVoted, setIsVoted] = useState(false)
  const [isOpponentLeaved, setIsOpponentLeaved] = useState(false)
  
  // 🚀 Локальный стейт для открытия модалки прямо здесь
  const [showModal, setShowModal] = useState(false)
  const [serverRewards, setServerRewards] = useState(null)

  const pollingInterval = useRef(null)
  const timeoutId = useRef(null)

  // Ваш рабочий [QA TEST] useEffect для пуллинга оценок оставляем БЕЗ изменений
  useEffect(() => {
    if (isRatingSubmitted && roomId) {
      pollingInterval.current = setInterval(() => {
        dispatch(fetchCheckRatingStatus(roomId))
      }, 2500);

      timeoutId.current = setTimeout(() => {
        clearInterval(pollingInterval.current);
        setIsOpponentLeaved(true); 
      }, 15000);
    }

    if (opponentRating !== null) {
      clearInterval(pollingInterval.current);
      clearTimeout(timeoutId.current);
    }

    return () => {
      clearInterval(pollingInterval.current);
      clearTimeout(timeoutId.current);
    };
  }, [isRatingSubmitted, opponentRating, roomId, dispatch]);

  const handleVoteSubmit = (rating) => {
    if (!roomId) return
    setIsVoted(true)

    dispatch(fetchSubmitLiveRating({ roomId, rating }))
      .unwrap()
      .then((data) => {
        // 🚀 Сохраняем прилетевшие с сервера награды в локальный стейт
        setServerRewards({
          rating,
          earnedXp: data.earnedXp || 50,
          earnedCoins: data.earnedCoins || 5,
          isLevelUp: data.isLevelUp,
          newLevel: data.stats?.level,
          achievements: data.newAchievements || [],
        })
      })
      .catch((err) => {
        alert(`Ошибка: ${err}`)
        setIsVoted(false)
      })
  }

  return (
    <div className={styles.feedback_block}>
      {!isVoted ? (
        <>
          <h3 className={styles.feedback_title}>Как справился ваш оппонент?</h3>
          <div className={styles.rating_buttons}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button key={num} className={styles.rating_btn} onClick={() => handleVoteSubmit(num)} disabled={loading}>{num}</button>
            ))}
          </div>
          <button className={styles.skip_btn} onClick={() => handleVoteSubmit(null)} disabled={loading}>Пропустить оценку</button>
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
                <FiCheckCircle size={44} className={styles.success_check_icon} />
                <p className={styles.muted_text}>Результаты синхронизированы!</p>
                
                {/* 🚀 Кнопка просто открывает модалку, которая лежит здесь же */}
                <button className={styles.leave_room_btn} onClick={() => setShowModal(true)}>
                  Посмотреть мои награды
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🚀 РЕНДЕР МОДАЛКИ НАПРЯМУЮ: Передаем награды сервера + оценку из Redux без посредников */}
      {showModal && serverRewards && (
        <LiveRoomRewardModal
          data={{
            ...serverRewards,
            opponentRating: opponentRating // Железно берется из живого Redux-стейта [INDEX]
          }}
          onClose={() => {
            setShowModal(false)
            dispatch(resetLiveDuelState()) // Сброс дуэлей и выход в меню [INDEX]
          }}
        />
      )}
    </div>
  )
}

export default LiveRoomFeedback

