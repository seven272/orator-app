import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../../../UI/spinner/Spinner'
import { useDispatch, useSelector } from 'react-redux'

import styles from './AntiFlatteryAi.module.css'
import { flatteryScenarios } from '../../../../assets/data/exercises/level3/ai-anti-flattery/flatteryScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import AntiFlatteryIdle from './anti-flattery-idle/AntiFlatteryIdle'
import AntiFlatteryProcess from './anti-flattery-process/AntiFlatteryProcess'
import AntiFlatteryResult from './anti-flattery-result/AntiFlatteryResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setFlatteryAiStatus,
  resetFlatteryState,
  fetchStartAntiFlattery,
  fetchResponseAntiFlattery,
  fetchFinishAntiFlattery,
} from '../../../../redux/slices/ai-exercises/antiFlatterySlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // 30 секунд на жесткий и аргументированный отказ

const AntiFlatteryAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.antiFlattery)
  const { messages, exStatus, aiStatus, borders } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация переговорного кейса
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], flatteryScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetFlatteryState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartAntiFlattery(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setFlatteryAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в сессии отражения лести')
        return
      }

      dispatch(setFlatteryAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseAntiFlattery({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishAntiFlattery({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, flatteryScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetFlatteryState())
  }

  const handleCloseExercise = () => {
    dispatch(resetFlatteryState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetFlatteryState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <Spinner centered={true} />

  return (
    <div className={styles.main_container}>
      <h2 className={styles.title}>Анти-Лесть</h2>
      <p className={styles.descr}>Защити свои деловые интересы и личные границы от приторных манипуляций</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <AntiFlatteryIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <AntiFlatteryProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            bordersProgress={borders}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <AntiFlatteryResult
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

export default AntiFlatteryAi
