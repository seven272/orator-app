import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PoemTongueAi.module.css' // Стилизуется по аналогии с TribuneAi
import poemTongueScenarios from '../../../../assets/data/scenarios/poemTongueScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import PoemTongueIdle from './poem-tongue-idle/PoemTongueIdle'
import PoemTongueProcess from './poem-tongue-process/PoemTongueProcess'
import PoemTongueResult from './poem-tongue-result/PoemTongueResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setPoemTongueAiStatus,
  resetPoemTongueState,
  fetchStartPoemTongue,
  fetchResponsePoemTongue,
  fetchFinishPoemTongue,
} from '../../../../redux/slices/ai-exercises/poemTongueSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 30

const PoemTongueAi = ({ alias, isDaily }) => {
  // Достаем методы и бинарный blob из вашего интеграционного хука SaluteSpeech
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechYandex()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomTongue, setRandomTongue] = useState(null)
  const [poolTongue, setPoolTongue] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // Достаем текущее состояние упражнения из Redux-хранилища
  const exerciseState = useSelector((state) => state.poemTongue)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация первой случайной скороговорки из базы на 10 штук
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      poemTongueScenarios,
    )
    setRandomTongue(selectedItem)
    setPoolTongue(newPool)
    
    // Чистим стейт при размонтировании экрана, защищая от утечек памяти
    return () => {
      dispatch(resetPoemTongueState())
    }
  }, [dispatch])

  // Реактивный триггер отправки собранного аудиофайла на бэкенд
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // Переключаем ИИ в режим генерации и отправляем бинарник
    dispatch(setPoemTongueAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponsePoemTongue({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // Подготавливаем хук к возможным новым записям
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartTongue = () => {
    if (!randomTongue) return
    dispatch(fetchStartPoemTongue(randomTongue))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setPoemTongueAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // Останавливаем запись, медиарекордер соберет чанки и сработает useEffect выше
    stopListening()
  }

  const handleFinishTongue = () => {
    dispatch(setPoemTongueAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishPoemTongue({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка при расчете логопедического вердикта:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Обновление темы (выбор новой скороговорки по кругу из пула)
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolTongue,
      poemTongueScenarios,
    )
    setRandomTongue(selectedItem)
    setPoolTongue(newPool)
    dispatch(resetPoemTongueState())
  }

  const handleCloseExercise = () => {
    dispatch(resetPoemTongueState())
    navigate('/exercises/level3') // Возврат в меню уровней
  }

  const handleRestartExercise = () => {
    dispatch(resetPoemTongueState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomTongue) return <ScreenSpinner />

  return (
    <div className={styles.main_tongue}>
      <h2 className={styles.title}>Тяжелая дикция</h2>
      <p className={styles.descr}>
        Прокачай артикуляцию и речевую опору на коварных текстах
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание старта (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <PoemTongueIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            tongueData={randomTongue}
            onStart={handleStartTongue}
          />
        )}

        {/* ЭКРАН 2: Чтение скороговорки и запись (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <PoemTongueProcess
            numberRounds={TOTAL_ROUNDS}
            tongue={randomTongue}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
              audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishTongue={handleFinishTongue}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Логопедический вердикт ИИ (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <PoemTongueResult
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

export default PoemTongueAi
