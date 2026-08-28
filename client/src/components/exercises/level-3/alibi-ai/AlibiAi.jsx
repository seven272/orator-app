import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './AlibiAi.module.css'
import { alibiScenarios } from '../../../../assets/data/scenarios/alibiScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import AlibiIdle from './alibi-idle/AlibiIdle'
import AlibiProcess from './alibi-process/AlibiProcess'
import AlibiResult from './alibi-result/AlibiResult'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setAlibiAiStatus,
  resetAlibiState,
  fetchStartAlibi,
  fetchResponseAlibi,
  fetchFinishAlibi
} from '../../../../redux/slices/ai-exercises/alibiSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20

const AlibiAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // --- СОСТОЯНИЕ КОМПОНЕНТА (ТОЛЬКО UI-состояние) ---
  const [randomSituation, setRandomSituation] = useState(null)
  const [poolSituation, setPoolSituation] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX (ГЛОБАЛЬНОЕ) ---
 const exerciseState = useSelector((state) => state.alibi) 
const { messages, exStatus, aiStatus, credibility } = exerciseState 
const isLoading = exStatus === 'loading'


  // Инициализация темы разговора
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      alibiScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)

    // Очистка при размонтировании компонента
    return () => {
      dispatch(resetAlibiState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomSituation) return
    dispatch(fetchStartAlibi(randomSituation))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript() // Очистить старый текст
    // Переключаем статус, чтобы UI мгновенно отобразил пульсацию и счетчик
    dispatch(setAlibiAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // ЗАЩИТА: Блокируем повторные вызовы от таймеров, если ИИ уже обрабатывает реплику
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    // Передаем колбэк: он выполнится СТРОГО один раз, когда файл собран в памяти
    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в ледоколе')
        return
      }

      // 1. Включаем статус анимации мышления
      dispatch(setAlibiAiStatus(AI_STATUS.AI_THINKING))

      // 2. Отправляем единственный бинарный файл на бэкенд
      dispatch(
        fetchResponseAlibi({
          audioBlob: readyBlob,
        }),
      ).then(() => {
        // 3. Сбрасываем внутренние буферы хука для следующего хода
        resetTranscript()
      })
    })
  }

  const handleFinishDialog = () => {
    // меняем экран на финальный
    setScreenStatus(SCREEN_STATUS.FINISHED)
    // диспатч на получение оценки,
    dispatch(fetchFinishAlibi({ isDaily }))
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolSituation,
      alibiScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)
    // При смене темы сбрасываем состояние упражнения в сторе
    dispatch(resetAlibiState())
  }

  const handleCloseExercise = () => {
    dispatch(resetAlibiState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetAlibiState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomSituation) return <ScreenSpinner />

  return (
    <div className={styles.main_alibi}>
      <h2 className={styles.title}>Железное алиби</h2>
      <p className={styles.descr}>Убеди прокурора в своей невиновности</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <AlibiIdle
            onRefreshTopic={() => handleRefreshTopic()}
            onShowTheory={() => setShowModal(true)}
            situationData={randomSituation}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <AlibiProcess
            numberRounds={TOTAL_ROUNDS}
            situation={randomSituation}
            messages={messages}
            credibilityProgress={credibility}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <AlibiResult
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

export default AlibiAi
