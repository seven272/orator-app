import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import Spinner from '../../../../UI/spinner/Spinner'
import styles from './NesmeyanaAi.module.css'
import { nesmeyanaScenarios } from '../../../../assets/data/exercises/level3/ai-nesmeyana/nesmeyanaScenarios'
import { getRandomObjTask } from '../../../../assets/data/exercises/utils/getRandomObjTask'
import NesmeyanaIdle from './nesmeyana-idle/NesmeyanaIdle'
import NesmeyanaProcess from './nesmeyana-process/NesmeyanaProcess'
import NesmeyanaResult from './nesmeyana-result/NesmeyanaResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../../../constants/exercises'

import {
  setNesmeyanaAiStatus,
  resetNesmeyanaState,
  fetchStartNesmeyana,
  fetchResponseNesmeyana,
  fetchFinishNesmeyana,
} from '../../../../redux/slices/ai-exercises/nesmeyanaSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1 
const TIME_ROUND = 45 // 45 секунд на выразительное чтение анекдота

const NesmeyanaAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } = useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА ---
  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX ---
  const exerciseState = useSelector((state) => state.nesmeyana)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация случайного хмурого слушателя
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask([], nesmeyanaScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    return () => {
      dispatch(resetNesmeyanaState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartNesmeyana(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setNesmeyanaAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в тренажере Несмеяна')
        return
      }

      dispatch(setNesmeyanaAiStatus(AI_STATUS.AI_THINKING))

      dispatch(
        fetchResponseNesmeyana({
          audioBlob: readyBlob,
        })
      ).then(() => {
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishNesmeyana({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(poolScenarios, nesmeyanaScenarios)
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetNesmeyanaState())
  }

  const handleCloseExercise = () => {
    dispatch(resetNesmeyanaState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetNesmeyanaState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <Spinner centered={true} />

  return ( 
    <div className={styles.main}>
      <h2 className={styles.title}>Несмеяна</h2>
      <p className={styles.descr}>Расскажи анекдот так, чтобы растопить лед самого хмурого и неулыбаемого слушателя</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <NesmeyanaIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <NesmeyanaProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
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
          <NesmeyanaResult
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

export default NesmeyanaAi
