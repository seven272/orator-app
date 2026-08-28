import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { CiMicrophoneOn } from 'react-icons/ci'
import { FaStopCircle } from 'react-icons/fa'
import { TbScoreboard } from 'react-icons/tb'

import {
  fetchSendLiveDuelMessageAiBot,
  fetchFinishLiveDuelAiBot,
  resetLiveDuelState,
} from '../../../../redux/slices/liveDuelSlice'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import styles from './LiveRoomAi.module.css'

// Локальные константы статусов, изолированные внутри компонента
const AI_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing', // Распознавание речи + генерация ответа ИИ
  FINISHED: 'finished', // Ожидание клика на анализ дуэли
}

const TIME_LIMIT = 20 // Ограничение на запись: 20 секунд

const LiveRoomAi = () => {
  const dispatch = useDispatch()
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()

  // Селекторы глобального стейта
  const { currentRoom, aiGreeting, loading, error } = useSelector(
    (state) => state.liveDuel,
  )

  // Локальные стейты для логики записи и раундов
  const [localAiStatus, setLocalAiStatus] = useState(AI_STATUS.IDLE)
  const [timer, setTimer] = useState(TIME_LIMIT)
  const [chatLog, setChatLog] = useState([])
  const [currentTurn, setCurrentTurn] = useState(1)
  const [duelSummary, setDuelSummary] = useState(null)

  const chatBottomRef = useRef(null)

  // 1. Инициализация чата приветствием от ИИ
  useEffect(() => {
    if (aiGreeting) {
      setChatLog([
        {
          id: 'initial_ai',
          sender: 'ai',
          text: aiGreeting,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    }
  }, [aiGreeting])

  // 2. Автоскролл чата вниз при обновлении сообщений
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  // 3. Логика сброса таймера при переходе в режим записи
  useEffect(() => {
    if (localAiStatus === AI_STATUS.RECORDING) {
      setTimer(TIME_LIMIT)
    }
  }, [localAiStatus])

  // 4. Логика работы интервала таймера (автостоп на 0 секунд)
  useEffect(() => {
    if (localAiStatus !== AI_STATUS.RECORDING) return

    if (timer === 0) {
      handleStopRecording()
      return
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [localAiStatus, timer])

  // Старт записи звука
  const handleStartRecording = () => {
    if (loading || localAiStatus === AI_STATUS.PROCESSING) return
    resetTranscript()
    setLocalAiStatus(AI_STATUS.RECORDING)
    startListening()
  }

  // Остановка записи звука и отправка файла на бэкенд
  const handleStopRecording = () => {
    // Защита от дребезга и повторных вызовов во время обработки
    if (loading || localAiStatus === AI_STATUS.PROCESSING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер. Отмена отправки.')
        setLocalAiStatus(AI_STATUS.IDLE)
        return
      }

      // Переключаем статус в обработку
      setLocalAiStatus(AI_STATUS.PROCESSING)

      // Отправляем блоб в асинхронный Thunk
      dispatch(
        fetchSendLiveDuelMessageAiBot({
          roomId: currentRoom?._id,
          audioBlob: readyBlob,
        }),
      )
        .unwrap()
        .then((result) => {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })

          // Массив для обновления локального чата
          const newMessages = [
            {
              id: `user_${Date.now()}`,
              sender: 'user',
              text: result.userText,
              timestamp,
            },
          ]

          // Пушим ответ ИИ только если он пришел (для 1 и 2 хода)
          if (result.answer) {
            newMessages.push({
              id: `ai_${Date.now()}`,
              sender: 'ai',
              text: result.answer,
              timestamp,
            })
          }

          setChatLog((prevLog) => [...prevLog, ...newMessages])
          resetTranscript()

          // Проверяем флаг финализации с бэкенда
          if (result.isFinished) {
            setLocalAiStatus(AI_STATUS.FINISHED)
          } else {
            setCurrentTurn((prev) => prev + 1)
            setLocalAiStatus(AI_STATUS.IDLE)
          }
        })
        .catch((err) => {
          console.error('Ошибка при отправке хода:', err)
          setLocalAiStatus(AI_STATUS.IDLE)
        })
    })
  }

  // Вызов финализации и получение вердикта ИИ-судьи
  const handleFinishDuel = async () => {
    try {
      setLocalAiStatus(AI_STATUS.PROCESSING)
      const res = await dispatch(
        fetchFinishLiveDuelAiBot({ roomId: currentRoom?._id }),
      ).unwrap()

      // Сохраняем поздравление и начисленные XP/Монеты из ответа сервера
      setDuelSummary({
        title: res.congratulations.title,
        message: res.congratulations.message,
        xp: res.earnedXp,
        coins: res.earnedCoins,
        isLevelUp: res.isLevelUp,
      })
    } catch (err) {
      console.error('Ошибка финализации дуэли:', err)
      setLocalAiStatus(AI_STATUS.FINISHED)
    }
  }

  const handleCloseSession = () => {
    dispatch(resetLiveDuelState())
  }

  return (
    <div className={styles.ai_room_container}>
      {/* Панель информации о сессии */}
      <div className={styles.info_header}>
        <div className={styles.topic_info}>
          <span className={styles.info_badge}>
            🤖 ИИ-Дуэль (Аудио)
          </span>
          <h2 className={styles.topic_title_short}>
            «{currentRoom?.topic?.title}»
          </h2>
        </div>
        {localAiStatus !== AI_STATUS.FINISHED && !duelSummary && (
          <div className={styles.turn_badge}>
            Раунд:{' '}
            <span className={styles.turn_count}>{currentTurn}/3</span>
          </div>
        )}
      </div>

      {/* Оповещение об ошибках сервера */}
      {error && <div className={styles.error_banner}>⚠️ {error}</div>}

      {/* Основная рабочая область: Окно чата ИЛИ Карточка успешного завершения */}
      {!duelSummary ? (
        <div className={styles.chat_window}>
          {chatLog.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.sender === 'user'
                  ? styles.message_user
                  : styles.message_ai
              }
            >
              <div className={styles.message_bubble}>{msg.text}</div>
              <span className={styles.message_time}>
                {msg.timestamp}
              </span>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
      ) : (
        /* Экран успешного завершения без оценок речи оппонента */
        <div className={styles.evaluation_card}>
          <h3 className={styles.eval_title}>{duelSummary.title}</h3>
          <p className={styles.eval_feedback}>
            {duelSummary.message}
          </p>

          <div className={styles.metrics_grid}>
            <div className={styles.metric_item}>
              <span className={styles.metric_name}>
                Получено опыта
              </span>
              <strong
                className={styles.metric_val}
                style={{ color: 'var(--color-blue-vk)' }}
              >
                +{duelSummary.xp} XP
              </strong>
            </div>
            <div className={styles.metric_item}>
              <span className={styles.metric_name}>
                Заработано монет
              </span>
              <strong
                className={styles.metric_val}
                style={{ color: '#cca20c' }}
              >
                +{duelSummary.coins} 🪙
              </strong>
            </div>

            {/* Блок поздравления с Новым Уровнем (Стакан) */}
            {duelSummary.isLevelUp && (
              <div
                className={styles.metric_item}
                style={{
                  backgroundColor: '#e8f5e9',
                  borderColor: 'var(--color-green)',
                }}
              >
                <span
                  className={styles.metric_name}
                  style={{
                    color: 'var(--color-green)',
                    fontWeight: 'bold',
                  }}
                >
                  🎉 Новый уровень!
                </span>
                <strong
                  className={styles.metric_val}
                  style={{ color: 'var(--color-green)' }}
                >
                  Поздравляем!
                </strong>
              </div>
            )}
          </div>

          <button
            className={styles.finish_btn}
            onClick={handleCloseSession}
          >
            В главное меню
          </button>
        </div>
      )}

      {/* Панель управления записью аудио в футере (скрывается на экране результатов) */}
      {!duelSummary && (
        <div className={styles.debate_footer}>
          {localAiStatus === AI_STATUS.IDLE && (
            <button
              onClick={handleStartRecording}
              className={styles.record_full_btn}
            >
              Нажмите, чтобы говорить <CiMicrophoneOn size={25} />
            </button>
          )}

          {localAiStatus === AI_STATUS.RECORDING && (
            <div className={styles.recording_wrapper}>
              <div className={styles.pulse_circle}></div>
              <span className={styles.timer_text}>{timer} сек</span>
              <button
                onClick={handleStopRecording}
                className={styles.stop_btn}
                disabled={loading}
              >
                <FaStopCircle size={45} />
              </button>
            </div>
          )}

          {localAiStatus === AI_STATUS.PROCESSING && (
            <div className={styles.status_wrapper}>
              <div className={styles.typing_dots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className={styles.status_text}>
                ИИ обрабатывает аудио и готовит ответ...
              </span>
            </div>
          )}

          {localAiStatus === AI_STATUS.FINISHED && (
            <button
              onClick={handleFinishDuel}
              className={styles.debate_finish_btn}
              disabled={loading}
            >
              Завершить и получить награды <TbScoreboard size={25} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default LiveRoomAi
