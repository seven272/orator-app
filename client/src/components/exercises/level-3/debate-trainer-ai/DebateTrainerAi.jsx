import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'
import aiDebateSnenarios from '../../../../assets/data/scenarios/debateSnenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import DebateIdle from './debate-idle/DebateIdle'
import DebateProcess from './debate-process/DebateProcess'
import DebateResult from './debate-result/DebateResult'
import styles from './DebateTrainerAi.module.css'

// Подключаем наш новый хук Сбера для записи WAV
import { useSpeechSber } from '../../../../hooks/useSpeechSber'

import {
  setDebateAiStatus,
  resetDebateState,
  fetchStartDebate,
  fetchSendUserResponseDebate,
  fetchFinishDebate,
} from '../../../../redux/slices/ai-exercises/debateSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 15

const DebateTrainerAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomTopic, setRandomTopic] = useState(null)
  const [poolTopic, setPoolTopic] = useState([])
  const [userPosition, setUserPosition] = useState('')
  const [userTopic, setUserTopic] = useState('')
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  const exerciseState = useSelector((state) => state.debate)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация темы дебатов
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      aiDebateSnenarios,
    )
    setRandomTopic(selectedItem)
    setPoolTopic(newPool)
    setUserTopic(selectedItem.topic)
    return () => {
      dispatch(resetDebateState())
    }
  }, [dispatch])

  // 💡 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Мы полностью УДАЛИЛИ старый useEffect,
  // который дублировал запросы и вызывал гонку условий на сервере!

  const handleStartDebate = () => {
    if (!userTopic || !userPosition) return
    dispatch(
      fetchStartDebate({ topic: userTopic, position: userPosition }),
    )
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setDebateAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // ЖЕЛЕЗОБЕТОННАЯ ЗАЩИТА: Если ИИ уже обрабатывает реплику,
    // полностью игнорируем любые повторные вызовы от таймеров или кнопок
    if (
      isLoading ||
      aiStatus === AI_STATUS.AI_THINKING ||
      aiStatus === AI_STATUS.PROCESSING
    ) {
      return
    }

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер. Отмена отправки.')
        return
      }

      // 1. Мгновенно блокируем статус
      dispatch(setDebateAiStatus(AI_STATUS.AI_THINKING))

      // 2. Шлем единственный валидный файл
      dispatch(
        fetchSendUserResponseDebate({ audioBlob: readyBlob }),
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDebate = (evt) => {
    evt.preventDefault()
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishDebate({ isDaily }))
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolTopic,
      aiDebateSnenarios,
    )
    setRandomTopic(selectedItem)
    setPoolTopic(newPool)
    setUserTopic(selectedItem.topic)
    setUserPosition('')
    dispatch(resetDebateState())
  }

  const handleCloseExercise = () => {
    dispatch(resetDebateState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetDebateState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomTopic) return <ScreenSpinner />

  return (
    <div className={styles.main_debate}>
      <h2 className={styles.title}>Дебат-клуб</h2>
      <p className={styles.descr}>
        {' '}
        Докажи свою точку зрения в споре с ИИ{' '}
      </p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <DebateIdle
            onRefreshTopic={() => handleRefreshTopic()}
            onShowTheory={() => setShowModal(true)}
            topicData={randomTopic}
            userPosition={userPosition}
            onPositionSelect={setUserPosition}
            onStartDebate={handleStartDebate}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <DebateProcess
            numberRounds={TOTAL_ROUNDS}
            topic={userTopic}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDebate={handleFinishDebate}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <DebateResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default DebateTrainerAi
