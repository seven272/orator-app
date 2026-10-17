import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './RhythmTransformerAi.module.css'
import { transformerScenarios } from '../../../../assets/data/exercises/level3/ai-rhythm-transformer/transformerScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import RhythmTransformerIdle from './rhythm-idle/RhythmTransformerIdle'
import RhythmTransformerProcess from './rhythm-process/RhythmTransformerProcess'
import RhythmTransformerResult from './rhythm-result/RhythmTransformerResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setTransformerAiStatus,
  resetTransformerState,
  fetchStartRhythmTransformer,
  fetchResponseRhythmTransformer,
  fetchFinishRhythmTransformer,
} from '../../../../redux/slices/ai-exercises/rhythmTransformerSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // 20 секунд на чистое прочтение скороговорки-трансформера

const RhythmTransformerAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.rhythmTransformer)
  const { exStatus, aiStatus, articulation, currentText } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация дикционного кейса
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], transformerScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetTransformerState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartRhythmTransformer(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setTransformerAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в сессии метронома')
        return
      }

      dispatch(setTransformerAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseRhythmTransformer({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishRhythmTransformer({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, transformerScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetTransformerState())
  }

  const handleCloseExercise = () => {
    dispatch(resetTransformerState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetTransformerState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>ИИ-Метроном</h2>
      <p className={styles.descr}>Прокачай артикуляцию на скороговорках, усложняющихся в реальном времени</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <RhythmTransformerIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <RhythmTransformerProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            currentText={currentText}
            articulationProgress={articulation}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <RhythmTransformerResult
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

export default RhythmTransformerAi
