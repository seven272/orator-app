import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import styles from './EmpathySparkAi.module.css'
import { empathyScenarios } from '../../../../assets/data/exercises/level3/ai-empathy-spark/empathyScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import EmpathySparkIdle from './empathy-idle/EmpathySparkIdle'
import EmpathySparkProcess from './empathy-process/EmpathySparkProcess'
import EmpathySparkResult from './empathy-result/EmpathySparkResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'
import Spinner from '../../../../UI/spinner/Spinner'

import {
  setEmpathyAiStatus,
  resetEmpathyState,
  fetchStartEmpathySpark,
  fetchResponseEmpathySpark,
  fetchFinishEmpathySpark,
} from '../../../../redux/slices/ai-exercises/empathySparkSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // 30 секунд на бережную реплику поддержки

const EmpathySparkAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.empathySpark)
  const { messages, exStatus, aiStatus, empathyBalance } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация психологического кейса
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], empathyScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetEmpathyState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartEmpathySpark(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setEmpathyAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в сессии эмпатии')
        return
      }

      dispatch(setEmpathyAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseEmpathySpark({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishEmpathySpark({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, empathyScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetEmpathyState())
  }

  const handleCloseExercise = () => {
    dispatch(resetEmpathyState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetEmpathyState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <Spinner centered={true} />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>Генератор Эмпатии</h2>
      <p className={styles.descr}>Помоги человеку справиться с кризисом, используя активное слушание</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <EmpathySparkIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <EmpathySparkProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            balanceProgress={empathyBalance}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <EmpathySparkResult
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

export default EmpathySparkAi
