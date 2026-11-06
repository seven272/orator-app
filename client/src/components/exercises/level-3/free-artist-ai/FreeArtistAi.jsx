import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import styles from './FreeArtistAi.module.css'
import FreeArtistIdle from './free-artist-idle/FreeArtistIdle'
import FreeArtistProcess from './free-artist-process/FreeArtistProcess'
import FreeArtistResult from './free-artist-result/FreeArtistResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setFreeArtistAiStatus,
  resetFreeArtistState,
  fetchStartFreeArtist,
  fetchResponseFreeArtist,
  fetchFinishFreeArtist,
} from '../../../../redux/slices/ai-exercises/freeArtistSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1 
const TIME_ROUND = 90 // 1.5 минуты на свободное развернутое выступление

const FreeArtistAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [customTopic, setCustomTopic] = useState('')
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.freeArtist)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Сброс состояния при размонтировании
  useEffect(() => {
    return () => {
      dispatch(resetFreeArtistState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!customTopic.trim()) return
    dispatch(fetchStartFreeArtist(customTopic.trim()))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setFreeArtistAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в свободном художнике')
        return
      }

      dispatch(setFreeArtistAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseFreeArtist({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishFreeArtist({ isDaily }))
  }

  const handleCloseExercise = () => {
    dispatch(resetFreeArtistState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetFreeArtistState())
    setCustomTopic('')
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  return ( 
    <div className={styles.main}>
      <h2 className={styles.title}>Свободный художник</h2>
      <p className={styles.descr}>Полная свобода слова: выбери свою тему, произнеси монолог или презентацию проекта и получи персональный экспертный разбор от ИИ</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <FreeArtistIdle
            customTopic={customTopic}
            setCustomTopic={setCustomTopic}
            onShowTheory={() => setShowModal(true)}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <FreeArtistProcess
            numberRounds={TOTAL_ROUNDS}
            topic={customTopic}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <FreeArtistResult
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

export default FreeArtistAi
