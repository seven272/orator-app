import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'
import styles from './BargainAi.module.css'

// Подключаем сценарии для торга
import bargainScenarios from '../../../../assets/data/scenarios/bargainScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'

// Будущие дочерние компоненты торга
import BargainIdle from './bargain-idle/BargainIdle'
import BargainProcess from './bargain-process/BargainProcess'
import BargainResult from './bargain-result/BargainResult'

import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

// Импортируем экшены из созданного ранее bargainSlice
import {
  setBargainAiStatus,
  resetBargainState,
  fetchStartBargain,
  fetchResponseBargain,
  fetchFinishBargain,
} from '../../../../redux/slices/ai-exercises/bargainSlice'

import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20

const BargainAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // --- СОСТОЯНИЕ КОМПОНЕНТА (ТОЛЬКО UI-состояние) ---
  const [randomSituation, setRandomSituation] = useState(null)
  const [poolSituation, setPoolSituation] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- СОСТОЯНИЕ ИЗ REDUX (Связано со слайсом bargain) ---
  const exerciseState = useSelector((state) => state.bargain)
  const { messages, exStatus, aiStatus, currentPrice, targetPrice } =
    exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация темы разговора
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      bargainScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)

    // Очистка при размонтировании компонента
    return () => {
      dispatch(resetBargainState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomSituation) return
    dispatch(fetchStartBargain(randomSituation))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript() // Очистить старый текст
    // Переключаем статус, чтобы UI мгновенно отобразил пульсацию и счетчик
    dispatch(setBargainAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // ЗАЩИТА: Блокируем повторные вызовы от таймеров, если ИИ уже обрабатывает реплику
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    // Передаем колбэк: он выполнится СТРОГО один раз, когда файл собран в памяти
    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn('Микрофон выдал пустой буфер в тренажере торга')
        return
      }
      // 1. Включаем статус анимации мышления
      dispatch(setBargainAiStatus(AI_STATUS.AI_THINKING))
      // 2. Отправляем единственный бинарный файл на бэкенд
      dispatch(fetchResponseBargain({ audioBlob: readyBlob })).then(
        () => {
          // 3. Сбрасываем внутренние буферы хука для следующего хода
          resetTranscript()
        },
      )
    })
  }

  const handleFinishDialog = () => {
    // меняем экран на финальный
    setScreenStatus(SCREEN_STATUS.FINISHED)
    // диспатч на получение оценки, передаем статус ежедневного задания
    dispatch(fetchFinishBargain({ isDaily }))
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolSituation,
      bargainScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)
    // При смене темы сбрасываем состояние упражнения в сторе
    dispatch(resetBargainState())
  }

  const handleCloseExercise = () => {
    dispatch(resetBargainState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetBargainState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomSituation) return <ScreenSpinner />

  return (
    <div className={styles.main_bargain}>
      <h2 className={styles.title}>Торг уместен</h2>
      <p className={styles.descr}>
        Используй сильные аргументы и сбей цену до максимума
      </p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <BargainIdle
            onRefreshTopic={() => handleRefreshTopic()}
            onShowTheory={() => setShowModal(true)}
            situationData={randomSituation}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <BargainProcess
            numberRounds={TOTAL_ROUNDS}
            situation={randomSituation}
            messages={messages}
            currentPrice={currentPrice}
            targetPrice={targetPrice}
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
          <BargainResult
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

export default BargainAi
