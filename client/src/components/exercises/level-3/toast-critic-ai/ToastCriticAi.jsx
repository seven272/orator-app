import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './ToastCriticAi.module.css'
import { toastScenarios } from '../../../../assets/data/exercises/level3/ai-toast-critic/toastScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import ToastCriticIdle from './toast-idle/ToastCriticIdle'
import ToastCriticProcess from './toast-process/ToastCriticProcess'
import ToastCriticResult from './toast-result/ToastCriticResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setToastCriticAiStatus,
  resetToastCriticState,
  fetchStartToastCritic,
  fetchResponseToastCritic,
  fetchFinishToastCritic,
} from '../../../../redux/slices/ai-exercises/toastCriticSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1 // Особенность тренажера: игрок произносит один цельный праздничный тост
const TIME_ROUND = 35 // 35 секунд на разворот красивой структуры тоста

const ToastCriticAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.toastCritic)
  const { messages, exStatus, aiStatus, emotionalResponse } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация праздничного инфоповода
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], toastScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetToastCriticState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartToastCritic(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setToastCriticAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в банкетном критике')
        return
      }

      dispatch(setToastCriticAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseToastCritic({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishToastCritic({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, toastScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetToastCriticState())
  }

  const handleCloseExercise = () => {
    dispatch(resetToastCriticState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetToastCriticState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>Банкетный критик</h2>
      <p className={styles.descr}>Произнеси праздничный тост по заданной схеме и получи рецензию эксперта</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <ToastCriticIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <ToastCriticProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            emotionalProgress={emotionalResponse}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <ToastCriticResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>

      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent alias={alias} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  )
}

export default ToastCriticAi
