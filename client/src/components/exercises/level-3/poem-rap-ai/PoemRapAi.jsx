import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PoemRapAi.module.css' 
import poemRapScenarios from '../../../../assets/data/scenarios/poemRapScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import PoemRapIdle from './poem-rap-idle/PoemRapIdle'
import PoemRapProcess from './poem-rap-process/PoemRapProcess'
import PoemRapResult from './poem-rap-result/PoemRapResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setPoemRapAiStatus,
  resetPoemRapState,
  fetchStartPoemRap,
  fetchResponsePoemRap,
  fetchFinishPoemRap,
} from '../../../../redux/slices/ai-exercises/poemRapSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 30

const PoemRapAi = ({ alias, isDaily }) => {
  // Достаем методы управления и бинарный blob из вашего интеграционного хука SaluteSpeech
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechYandex()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomRap, setRandomRap] = useState(null)
  const [poolRap, setPoolRap] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // Получаем текущее состояние упражнения из Redux-хранилища
  const exerciseState = useSelector((state) => state.poemRap)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Выбираем случайный рэп-сценарий из базы при монтировании экрана
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      poemRapScenarios,
    )
    setRandomRap(selectedItem)
    setPoolRap(newPool)
    
    // Чистим стейт при размонтировании экрана для предотвращения утечек памяти
    return () => {
      dispatch(resetPoemRapState())
    }
  }, [dispatch])

  // Реактивный эффект отправки готового аудиобинарника на бэкенд
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    // Переводим ИИ в статус "ИИ думает" и отправляем FormData
    dispatch(setPoemRapAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponsePoemRap({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      // Сбрасываем блоб в хуке для подготовки к возможной новой сессии
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartRap = () => {
    if (!randomRap) return
    dispatch(fetchStartPoemRap(randomRap))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setPoemRapAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    // Команда на остановку. Хук асинхронно сформирует blob, и сработает useEffect выше
    stopListening()
  }

  const handleFinishRap = () => {
    dispatch(setPoemRapAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishPoemRap({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка при расчете рэп-вердикта от ИИ-продюсера:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Смена темы по кругу из текущего пула
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolRap,
      poemRapScenarios,
    )
    setRandomRap(selectedItem)
    setPoolRap(newPool)
    dispatch(resetPoemRapState())
  }

  const handleCloseExercise = () => {
    dispatch(resetPoemRapState())
   navigate('/exercises/level3') // Возврат на экран уровней
  }

  const handleRestartExercise = () => {
    dispatch(resetPoemRapState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomRap) return <ScreenSpinner />

  return (
    <div className={styles.main_poem_rap}>
      <h2 className={styles.title}>Рэп-манифест</h2>
      <p className={styles.descr}>
        Преврати классические стихи в качающий хип-хоп трек и поймай внутренний ритм
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание старта (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <PoemRapIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            rapData={randomRap}
            onStart={handleStartRap}
          />
        )}

        {/* ЭКРАН 2: Читка стиха и запись аудио (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <PoemRapProcess
            numberRounds={TOTAL_ROUNDS}
            rap={randomRap}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishRap={handleFinishRap}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Вердикт ИИ-продюсера и оценки (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <PoemRapResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>

      {/* Модальное окно теории */}
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default PoemRapAi
