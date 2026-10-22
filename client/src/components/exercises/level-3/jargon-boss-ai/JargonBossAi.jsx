import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import styles from './JargonBossAi.module.css'
import Spinner from '../../../../UI/spinner/Spinner'
import { jargonScenarios } from '../../../../assets/data/exercises/level3/ai-jargon-boss/jargonScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import JargonIdle from './jargon-idle/JargonIdle'
import JargonProcess from './jargon-process/JargonProcess'
import JargonResult from './jargon-result/JargonResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setJargonAiStatus,
  resetJargonState,
  fetchStartJargonBoss,
  fetchResponseJargonBoss,
  fetchFinishJargonBoss,
} from '../../../../redux/slices/ai-exercises/jargonBossSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // Даем 20 секунд на интеграцию блатного жаргона

const JargonBossAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.jargonBoss)
  const { messages, exStatus, aiStatus, reputation } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация темы конфликта
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], jargonScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetJargonState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartJargonBoss(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setJargonAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в разборке')
        return
      }

      dispatch(setJargonAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseJargonBoss({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishJargonBoss({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, jargonScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetJargonState())
  }

  const handleCloseExercise = () => {
    dispatch(resetJargonState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetJargonState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <Spinner centered={true} />
  return (
    <div className={styles.main_jargon}>
      <h2 className={styles.title}>Разрули Тёрки</h2>
      <p className={styles.descr}>Поставь наглого оппонента на место разговором по понятиям</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <JargonIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <JargonProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            reputationProgress={reputation}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <JargonResult
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

export default JargonBossAi
