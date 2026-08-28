import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './StopWordAi.module.css'
import stopWordScenarios from '../../../../assets/data/scenarios/stopWordScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import StopWordIdle from './stop-word-idle/StopWordIdle'
import StopWordProcess from './stop-word-process/StopWordProcess'
import StopWordResult from './stop-word-result/StopWordResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setStopWordAiStatus,
  resetStopWordState,
  fetchStartStopWord,
  fetchResponseStopWord,
  fetchFinishStopWord,
} from '../../../../redux/slices/ai-exercises/stopWordSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 40

const StopWordAi = ({ alias, isDaily }) => {
  // Интеграционный хук SaluteSpeech для записи звука
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

  // ИСПРАВЛЕНИЕ: Достаем стейт строго из вашей ветки хранилища state.stopWord
  const exerciseState = useSelector((state) => state.stopWord)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Инициализация первой случайной темы из базы Анти-слов
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      stopWordScenarios,
    )
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)

    // Сброс стейта при выходе из упражнения
    return () => {
      dispatch(resetStopWordState())
    }
  }, [dispatch])

  // Автоматический триггер отправки готового бинарного аудио на бэкенд
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // Переводим ИИ в статус обработки и отправляем файл
    dispatch(setStopWordAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponseStopWord({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // Очищаем локальный буфер хука для последующих записей
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartExercise = () => {
    if (!randomScenario) return
    dispatch(fetchStartStopWord(randomScenario))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setStopWordAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    stopListening() // Браузер соберет чанки, обновит audioBlob и сработает useEffect выше
  }

  const handleFinishExercise = () => {
    dispatch(setStopWordAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishStopWord({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error(
          'Ошибка при получении аналитики Анти-слов:',
          err,
        )
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Смена темы по кругу внутри пула
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolScenarios,
      stopWordScenarios,
    )
    setRandomScenario(selectedItem)
    setPoolScenarios(newPool)
    dispatch(resetStopWordState())
  }

  const handleCloseExercise = () => {
    dispatch(resetStopWordState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetStopWordState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomScenario) return <ScreenSpinner />

  return (
    <div className={styles.main_stop_word}>
      <h2 className={styles.title}>Анти-слова</h2>
      <p className={styles.descr}>
        Попробуй красочно описать ситуацию, обходя хитрые табу и
        стоп-слова
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание старта (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <StopWordIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            scenarioData={randomScenario}
            onStart={handleStartExercise}
          />
        )}

        {/* ЭКРАН 2: Чтение и запись монолога (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <StopWordProcess
            numberRounds={TOTAL_ROUNDS}
            scenario={randomScenario}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishExercise={handleFinishExercise}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Вердикт ИИ-цензора (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <StopWordResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>

      {/* Модальное окно с теорией речи */}
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default StopWordAi
