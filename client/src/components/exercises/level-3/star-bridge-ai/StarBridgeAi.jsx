import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './StarBridgeAi.module.css'
import { starScenarios } from '../../../../assets/data/exercises/level3/ai-star-bridge/starScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import StarBridgeIdle from './star-bridge-idle/StarBridgeIdle'
import StarBridgeProcess from './star-bridge-process/StarBridgeProcess'
import StarBridgeResult from './star-bridge-result/StarBridgeResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setStarAiStatus,
  resetStarState,
  fetchStartStarBridge,
  fetchResponseStarBridge,
  fetchFinishStarBridge,
} from '../../../../redux/slices/ai-exercises/starBridgeSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // Ультра-короткий лимит (20 сек) для Elevator Pitch в лифте

const StarBridgeAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.starBridge)
  const { messages, exStatus, aiStatus, attention } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация переговорного кейса
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], starScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetStarState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartStarBridge(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setStarAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в сессии питча')
        return
      }

      dispatch(setStarAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseStarBridge({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishStarBridge({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, starScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetStarState())
  }

  const handleCloseExercise = () => {
    dispatch(resetStarState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetStarState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>Мост к кумиру</h2>
      <p className={styles.descr}>У тебя есть всего 3 раунда в лифте, чтобы заинтересовать топ-босса или селебрити</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <StarBridgeIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <StarBridgeProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            attentionProgress={attention}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <StarBridgeResult
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

export default StarBridgeAi
