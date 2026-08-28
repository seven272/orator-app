import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './TribuneAi.module.css'
import aiTribuneScenarios from '../../../../assets/data/scenarios/tribuneScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import TribuneIdle from './tribune-idle/TribuneIdle'
import TribuneProcess from './tribune-process/TribuneProcess'
import TribuneResult from './tribune-result/TribuneResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setTribuneAiStatus,
  resetTribuneState,
  fetchStartTribune,
  fetchResponseTribune,
  fetchFinishTribune,
} from '../../../../redux/slices/ai-exercises/tribuneSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'
 
const TOTAL_ROUNDS = 1
const TIME_ROUND = 40

const TribuneAi = ({ alias, isDaily }) => {
  // ИСПРАВЛЕНИЕ 1: Обязательно достаем audioBlob из нашего нового хука
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechSber()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomTribune, setRandomTribune] = useState(null)
  const [poolTribune, setPoolTribune] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  const exerciseState = useSelector((state) => state.tribune)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация темы упражнения
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      aiTribuneScenarios,
    )
    setRandomTribune(selectedItem)
    setPoolTribune(newPool)
    return () => {
      dispatch(resetTribuneState())
    }
  }, [dispatch])

  // ИСПРАВЛЕНИЕ 2: Реактивный триггер отправки файла.
  // Как только асинхронный MediaRecorder закончил запись и сформировал blob — отправляем его на бэк!
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // 1. Ставим статус "ИИ думает"
    dispatch(setTribuneAiStatus(AI_STATUS.AI_THINKING))

    // 2. Отправляем строго готовый бинарник
    dispatch(
      fetchResponseTribune({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // 3. Сбрасываем блоб в хуке, чтобы подготовиться к новой записи
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartInerview = () => {
    if (!randomTribune) return
    dispatch(fetchStartTribune(randomTribune))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setTribuneAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // Просто даем команду на остановку.
    // Браузер асинхронно соберет чанки, обновит audioBlob, и сработает useEffect сверху.
    stopListening()
  }

  const handleFinishTribune = () => {
    dispatch(setTribuneAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishTribune({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка при получении аналитики трибуны:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolTribune,
      aiTribuneScenarios,
    )
    setRandomTribune(selectedItem)
    setPoolTribune(newPool)
    dispatch(resetTribuneState())
  }

  const handleCloseExercise = () => {
    dispatch(resetTribuneState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetTribuneState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomTribune) return <ScreenSpinner />

  return (
    <div className={styles.main_tribune}>
      <h2 className={styles.title}>Трибуна</h2>
      <p className={styles.descr}>
        Выскажись по теме как настоящий оратор
      </p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <TribuneIdle
            onRefreshTopic={() => handleRefreshTopic()}
            onShowTheory={() => setShowModal(true)}
            tribuneData={randomTribune}
            onStart={handleStartInerview}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <TribuneProcess
            numberRounds={TOTAL_ROUNDS}
            tribune={randomTribune}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishTribune={handleFinishTribune}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <TribuneResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default TribuneAi
