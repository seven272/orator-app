import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './RadioHostAi.module.css'
import radioHostScenarios from '../../../../assets/data/scenarios/radioHostScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import RadioHostIdle from './radio-host-idle/RadioHostIdle'
import RadioHostProcess from './radio-host-process/RadioHostProcess'
import RadioHostResult from './radio-host-result/RadioHostResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setRadioHostAiStatus,
  resetRadioHostState,
  fetchStartRadioHost,
  fetchResponseRadioHost,
  fetchFinishRadioHost,
} from '../../../../redux/slices/ai-exercises/radioHostSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 60

const RadioHostAi = ({ alias, isDaily }) => {
  // Достаем методы управления записью и бинарный blob из вашего интеграционного хука SaluteSpeech
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechYandex()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomRadio, setRandomRadio] = useState(null)
  const [poolRadio, setPoolRadio] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // Получаем текущее состояние упражнения из глобального хранилища Redux
  const exerciseState = useSelector((state) => state.radioHost)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация случайной карточки новостей из базы прямого эфира
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      radioHostScenarios,
    )
    setRandomRadio(selectedItem)
    setPoolRadio(newPool)

    // Мгновенная очистка стейта при выходе из тренажера (защита от утечек памяти)
    return () => {
      dispatch(resetRadioHostState())
    }
  }, [dispatch])

  // Реактивный эффект: как только MediaRecorder зафиксировал остановку и собрал blob — шлем на бэк
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // Переводим ИИ в статус обработки и отправляем FormData
    dispatch(setRadioHostAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponseRadioHost({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // Сбрасываем внутренний транскрипт хука для подготовки к возможным новым дублям
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartRadio = () => {
    if (!randomRadio) return
    dispatch(fetchStartRadioHost(randomRadio))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setRadioHostAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // Даем команду на стоп. Хук асинхронно сформирует готовый blob, и сработает useEffect выше
    stopListening()
  }

  const handleFinishRadio = () => {
    dispatch(setRadioHostAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishRadioHost({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error(
          'Ошибка при расчете рецензии программного директора:',
          err,
        )
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Обновление темы (выбор новой карточки новостей по кругу из текущего пула)
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolRadio,
      radioHostScenarios,
    )
    setRandomRadio(selectedItem)
    setPoolRadio(newPool)
    dispatch(resetRadioHostState())
  }

  const handleCloseExercise = () => {
    dispatch(resetRadioHostState())
    navigate('/exercises/level3') // Навигация в меню уровней VK Mini App
  }

  const handleRestartExercise = () => {
    dispatch(resetRadioHostState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomRadio) return <ScreenSpinner />

  return (
    <div className={styles.main_radio_host}>
      <h2 className={styles.title}>Радиоведущий</h2>
      <p className={styles.descr}>
        Проведи бодрый эфирный перерыв, импровизируя на ходу без пауз
        и мычания
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание старта (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <RadioHostIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            radioData={randomRadio}
            onStart={handleStartRadio}
          />
        )}

        {/* ЭКРАН 2: Прямой эфир и запись монолога (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <RadioHostProcess
            numberRounds={TOTAL_ROUNDS}
            radio={randomRadio}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishRadio={handleFinishRadio}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Оценки программного директора и фидбек (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <RadioHostResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>

      {/* Модалка с теоретическим материалом */}
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default RadioHostAi
