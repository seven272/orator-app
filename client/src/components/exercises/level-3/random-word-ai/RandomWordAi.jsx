import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './RandomWordAi.module.css'
import randomWordScenarios from '../../../../assets/data/scenarios/randomWordScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import RandomWordIdle from './random-word-idle/RandomWordIdle'
import RandomWordProcess from './random-word-process/RandomWordProcess'
import RandomWordResult from './random-word-result/RandomWordResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setRandomWordAiStatus,
  resetRandomWordState,
  fetchStartRandomWord,
  fetchResponseRandomWord,
  fetchFinishRandomWord,
} from '../../../../redux/slices/ai-exercises/randomWordSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 60 // Для импровизации обычно закладывают чуть больше времени (например, 60 сек)

const RandomWordAi = ({ alias, isDaily }) => {
  // Достаем методы и бинарный blob из вашего интеграционного хука SaluteSpeech
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechYandex()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomScenario, setRandomScenario] = useState(null)
  const [poolScenarios, setPoolScenarios] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // Достаем текущее состояние упражнения из Redux-хранилища
  const exerciseState = useSelector((state) => state.randomWord)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация первого случайного сценария из "шляпы"
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      randomWordScenarios,
    )
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    
    // Чистим стейт при размонтировании экрана, защищая от утечек памяти
    return () => {
      dispatch(resetRandomWordState())
    }
  }, [dispatch])

  // Реактивный триггер отправки собранного аудиофайла на бэкенд
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // Переключаем ИИ в режим генерации и отправляем бинарник
    dispatch(setRandomWordAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponseRandomWord({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // Подготавливаем хук к возможным новым записям
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartScenario = () => {
    if (!randomScenario) return
    dispatch(fetchStartRandomWord(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setRandomWordAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // Останавливаем запись, медиарекордер соберет чанки и сработает useEffect выше
    stopListening()
  }

  const handleFinishScenario = () => {
    dispatch(setRandomWordAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishRandomWord({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка при расчете вердикта импровизации:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Обновление темы (выбор нового сценария по кругу из пула)
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolScenarios,
      randomWordScenarios,
    )
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetRandomWordState())
  }

  const handleCloseExercise = () => {
    dispatch(resetRandomWordState())
    navigate('/exercises/level3') // Возврат в меню уровней согласно вашей структуре
  }

  const handleRestartExercise = () => {
    dispatch(resetRandomWordState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main_word}>
      <h2 className={styles.title}>Слово из шляпы</h2>
      <p className={styles.descr}>
        Прокачай харизму и скорость мышления, интегрируя абсурдные слова в речь
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание старта (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <RandomWordIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            scenarioData={randomScenario}
            onStart={handleStartScenario}
          />
        )}

        {/* ЭКРАН 2: Разговорный спич и запись (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <RandomWordProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishScenario={handleFinishScenario}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Вердикт ИИ-жюри (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <RandomWordResult
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

export default RandomWordAi
