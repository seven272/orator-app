import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PitchAi.module.css'
import { pitchScenarios } from '../../../../assets/data/exercises/level3/ai-commercial-pitch/pitchScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import PitchIdle from './pitch-idle/PitchIdle'
import PitchProcess from './pitch-process/PitchProcess'
import PitchResult from './pitch-result/PitchResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'
import Spinner from '../../../../UI/spinner/Spinner'

import {
  setPitchAiStatus,
  resetPitchState,
  fetchStartCommercialPitch,
  fetchResponseCommercialPitch,
  fetchFinishCommercialPitch,
} from '../../../../redux/slices/ai-exercises/commercialPitchSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20 // Даем 20 секунд на формулирование УТП и маркетинг-питча

const PitchAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА (UI) ---
  const [randomSubject, setRandomSubject] = useState(null)
  const [poolSubjects, setPoolSubjects] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX (GLOBAL) ---
  const exerciseState = useSelector((state) => state.commercialPitch)
  const { messages, exStatus, aiStatus, interest } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация случайного бытового предмета для питча
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], pitchScenarios)
    setRandomSubject(selectedItem)
    setPoolSubjects(newPool)

    // Полная очистка глобального стейта при размонтировании
    return () => {
      dispatch(resetPitchState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomSubject) return
    dispatch(fetchStartCommercialPitch(randomSubject))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setPitchAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер во время презентации стартапа')
        return
      }

      dispatch(setPitchAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseCommercialPitch({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishCommercialPitch({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolSubjects, pitchScenarios)
    setRandomSubject(selectedItem)
    setPoolSubjects(newPool)
    dispatch(resetPitchState())
  }

  const handleCloseExercise = () => {
    dispatch(resetPitchState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetPitchState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomSubject) return <Spinner centered={true} />

  return (
    <div className={styles.main}>
      <h2 className={styles.title}>Суровый Инвестор Эдуард</h2>
      <p className={styles.descr}>Презентуй бытовой предмет как революционный бизнес-стартап</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <PitchIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            subjectData={randomSubject}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <PitchProcess
            numberRounds={TOTAL_ROUNDS}
            subject={randomSubject}
            messages={messages}
            interestProgress={interest}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <PitchResult
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

export default PitchAi
