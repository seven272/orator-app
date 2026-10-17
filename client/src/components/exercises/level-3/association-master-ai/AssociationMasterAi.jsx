import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './AssociationMasterAi.module.css'
import { associationScenarios } from '../../../../assets/data/exercises/level3/ai-association-master/associationScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import AssociationMasterIdle from './association-idle/AssociationMasterIdle'
import AssociationMasterProcess from './association-process/AssociationMasterProcess'
import AssociationMasterResult from './association-result/AssociationMasterResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setAssociationMasterAiStatus,
  resetAssociationMasterState,
  fetchStartAssociationMaster,
  fetchResponseAssociationMaster,
  fetchFinishAssociationMaster,
} from '../../../../redux/slices/ai-exercises/associationMasterSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1 // Особенность тренажера: игрок строит один цельный мост за один раунд
const TIME_ROUND = 30 // 30 секунд на красивую устную метафору

const AssociationMasterAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.associationMaster)
  const { messages, exStatus, aiStatus, originality } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация пары полярных понятий
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], associationScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetAssociationMasterState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartAssociationMaster(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setAssociationMasterAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в мосте смыслов')
        return
      }

      dispatch(setAssociationMasterAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseAssociationMaster({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishAssociationMaster({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, associationScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetAssociationMasterState())
  }

  const handleCloseExercise = () => {
    dispatch(resetAssociationMasterState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetAssociationMasterState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>Мост смыслов</h2>
      <p className={styles.descr}>Попробуй изящно связать два полярных понятия красивой ассоциацией</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <AssociationMasterIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <AssociationMasterProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            originalityProgress={originality}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <AssociationMasterResult
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

export default AssociationMasterAi
