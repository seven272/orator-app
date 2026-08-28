import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './InterviewAi.module.css'
import aiInterviewSnenarios from '../../../../assets/data/scenarios/interviewSnenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import InterviewIdle from './interview-idle/InterviewIdle'
import InterviewProcess from './interview-process/InterviewProcess'
import InterviewResult from './interview-result/InterviewResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setInterviewAiStatus,
  resetInterviewState,
  fetchStartInterview,
  fetchResponseInterview,
  fetchFinishInterview,
} from '../../../../redux/slices/ai-exercises/interviewSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 15

// const isSpeechSupported = !!(
//   typeof window !== 'undefined' &&
//   (window.SpeechRecognition || window.webkitSpeechRecognition)
// )

const InterviewAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // --- СОСТОЯНИЕ КОМПОНЕНТА (ТОЛЬКО UI-состояние) ---
  const [randomInterview, setRandomInterview] = useState(null)
  const [poolInterview, setPoolInterview] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX (ГЛОБАЛЬНОЕ) ---
  const exerciseState = useSelector((state) => state.interview)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация темы интервью
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      aiInterviewSnenarios,
    )
    setRandomInterview(selectedItem)
    setPoolInterview(newPool)
    // Очистка при размонтировании компонента
    return () => {
      dispatch(resetInterviewState())
    }
  }, [dispatch])

  const handleStartInerview = () => {
    if (!randomInterview) return
    dispatch(fetchStartInterview(randomInterview))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript() // Очистить старый текст
    // Переключаем статус, чтобы UI мгновенно отобразил пульсацию и счетчик
    dispatch(setInterviewAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // ЖЕЛЕЗОБЕТОННАЯ ЗАЩИТА: Блокируем повторную отправку при двойных триггерах таймера
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    // Передаем колбэк: сработает строго тогда, когда файл WAV полностью собран в памяти
    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в интервью')
        return
      }

      // 1. Включаем статус анимации мышления
      dispatch(setInterviewAiStatus(AI_STATUS.AI_THINKING))

      // 2. Отправляем единственный бинарный файл на бэк
      dispatch(
        fetchResponseInterview({
          audioBlob: readyBlob,
        }),
      ).then(() => {
        // 3. Сбрасываем внутренние буферы хука для следующего раунда
        resetTranscript()
      })
    })
  }
  const handleFinishExercise = () => {
    // меняем экран на финальный
    setScreenStatus(SCREEN_STATUS.FINISHED)
    // диспатч на получение оценки,
    dispatch(fetchFinishInterview({ isDaily }))
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolInterview,
      aiInterviewSnenarios,
    )
    setRandomInterview(selectedItem)
    setPoolInterview(newPool)
    // При смене темы сбрасываем состояние упражнения в сторе
    dispatch(resetInterviewState())
  }

  const handleCloseExercise = () => {
    dispatch(resetInterviewState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetInterviewState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomInterview) return <ScreenSpinner />

  return (
    <div className={styles.main_interview}>
      <h2 className={styles.title}>Неудобный вопрос</h2>
      <p className={styles.descr}>
        Формат острого телеинтервью с ИИ в роли ведущего
      </p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <InterviewIdle
            onRefreshTopic={() => handleRefreshTopic()}
            onShowTheory={() => setShowModal(true)}
            interviewData={randomInterview}
            onStart={handleStartInerview}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <InterviewProcess
            numberRounds={TOTAL_ROUNDS}
            interview={randomInterview}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishExercise={handleFinishExercise}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <InterviewResult
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

export default InterviewAi
