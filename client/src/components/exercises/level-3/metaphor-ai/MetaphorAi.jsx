import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'
import styles from './MetaphorAi.module.css'

// Импортируем массив тестовых сценариев переводчика
import  metaphorScenarios  from '../../../../assets/data/scenarios/metaphorScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'

// Будущие дочерние компоненты переводчика
import MetaphorIdle from './metaphor-idle/MetaphorIdle'
import MetaphorProcess from './metaphor-process/MetaphorProcess'
import MetaphorResult from './metaphor-result/MetaphorResult'

import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

// Импортируем экшены из созданного metaphorSlice
import {
  setMetaphorAiStatus,
  resetMetaphorState,
  fetchStartMetaphor,
  fetchResponseMetaphor,
  fetchFinishMetaphor,
} from '../../../../redux/slices/ai-exercises/metaphorSlice'

import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20

const MetaphorAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- UI СОСТОЯНИЕ ---
  const [randomSituation, setRandomSituation] = useState(null)
  const [poolSituation, setPoolSituation] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- REDUX СТEЙТ ---
  const exerciseState = useSelector((state) => state.metaphor)
  const { messages, exStatus, aiStatus, understanding } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация случайного сценария при загрузке
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      metaphorScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)

    return () => {
      dispatch(resetMetaphorState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomSituation) return
    dispatch(fetchStartMetaphor(randomSituation))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setMetaphorAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в тренажере переводчика')
        return
      }
      dispatch(setMetaphorAiStatus(AI_STATUS.AI_THINKING))
      dispatch(
        fetchResponseMetaphor({ audioBlob: readyBlob }),
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishMetaphor({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolSituation,
      metaphorScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)
    dispatch(resetMetaphorState())
  }

  const handleCloseExercise = () => {
    dispatch(resetMetaphorState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetMetaphorState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomSituation) return <ScreenSpinner />

  return (
    <div className={styles.main_metaphor}>
      <h2 className={styles.title}>Трудный переводчик</h2>
      <p className={styles.descr}>Прояви находчивость и объясни заумный термин на понятном языке</p>
      
      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <MetaphorIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomSituation}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <MetaphorProcess
            numberRounds={TOTAL_ROUNDS}
            messages={messages}
            understanding={understanding}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <MetaphorResult
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

export default MetaphorAi
