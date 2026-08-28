import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './HistoricalAi.module.css'
// Импортируем нашу базу из 20 сценариев, которую создали ранее
import aiHistoricalScenarios from '../../../../assets/data/scenarios/historicalScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import HistoricalIdle from './historical-idle/HistoricalIdle'
import HistoricalProcess from './historical-process/HistoricalProcess'
import HistoricalResult from './historical-result/HistoricalResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setHistoricalAiStatus,
  resetHistoricalState,
  fetchStartHistorical,
  fetchResponseHistorical,
  fetchFinishHistorical,
} from '../../../../redux/slices/ai-exercises/historicalSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

// Новые константы под измененные требования
const TOTAL_ROUNDS = 1
const TIME_ROUND = 90 // Лимит увеличен до 90 секунд (1.5 минуты)

const HistoricalAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, audioBlob, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  const exerciseState = useSelector((state) => state.historical)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация случайного исторического сценария
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], aiHistoricalScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    return () => {
      dispatch(resetHistoricalState())
    }
  }, [dispatch])

  // Реактивный триггер на отправку 90-секундного аудиофайла в Yandex SpeechKit
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    dispatch(setHistoricalAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchResponseHistorical({ audioBlob })).then(() => {
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartHistorical(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setHistoricalAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
  }

  const handleFinishHistorical = () => {
    dispatch(setHistoricalAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishHistorical({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка получения аналитики великих речей:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, aiHistoricalScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetHistoricalState())
  }

  const handleCloseExercise = () => {
    dispatch(resetHistoricalState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetHistoricalState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main_historical}>
      <h2 className={styles.title}>Эхо Истории</h2>
      <p className={styles.descr}>Примени приемы великих ораторов в реальной жизни</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <HistoricalIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            scenarioData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <HistoricalProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob} 
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishHistorical={handleFinishHistorical}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <HistoricalResult
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

export default HistoricalAi
