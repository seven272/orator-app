import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'

import styles from './PoemActingAi.module.css' 
import poemActingScenarios from '../../../../assets/data/scenarios/poemActingScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import PoemActingIdle from './poem-acting-idle/PoemActingIdle'
import PoemActingProcess from './poem-acting-process/PoemActingProcess'
import PoemActingResult from './poem-acting-result/PoemActingResult'
import { useSpeechYandex } from '../../../../hooks/useSpeechYandex'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

import {
  setPoemActingAiStatus,
  resetPoemActingState,
  fetchStartPoemActing,
  fetchResponsePoemActing,
  fetchFinishPoemActing,
} from '../../../../redux/slices/ai-exercises/poemActingSlice'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 1
const TIME_ROUND = 30

const PoemActingAi = ({ alias, isDaily }) => {
  // Подключаем ваш интеграционный SaluteSpeech STT хук
  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechYandex()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [randomActing, setRandomActing] = useState(null)
  const [poolActing, setPoolActing] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // Извлекаем стейт сессии актера
  const exerciseState = useSelector((state) => state.poemActing)
  const { messages, exStatus, aiStatus } = exerciseState
  const isLoading = exStatus === 'loading'

  // Подгружаем случайный актерский вызов из 10 штук
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      poemActingScenarios,
    )
    setRandomActing(selectedItem)
    setPoolActing(newPool)
    
    // Сброс стейта при уходе, чтобы не засорять Redux-хранилище
    return () => {
      dispatch(resetPoemActingState())
    }
  }, [dispatch])

  // Реактивный перехватчик готовой аудиозаписи для отправки на бэк
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    dispatch(setPoemActingAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponsePoemActing({
        audioBlob: audioBlob,
      }),
    ).then(() => {
      resetTranscript()
    })
  }, [audioBlob, dispatch, resetTranscript])

  const handleStartActing = () => {
    if (!randomActing) return
    dispatch(fetchStartPoemActing(randomActing))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setPoemActingAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
  }

  const handleFinishActing = () => {
    dispatch(setPoemActingAiStatus(AI_STATUS.AI_THINKING))

    dispatch(fetchFinishPoemActing({ isDaily }))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        console.error('Ошибка кастинг-разбора от ИИ:', err)
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleAutoSubmit = () => {
    handleStopRecording()
  }

  // Ротация актерских сценариев кнопкой обновления
  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolActing,
      poemActingScenarios,
    )
    setRandomActing(selectedItem)
    setPoolActing(newPool)
    dispatch(resetPoemActingState())
  }

  const handleCloseExercise = () => {
    dispatch(resetPoemActingState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetPoemActingState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomActing) return <ScreenSpinner />

  return (
    <div className={styles.main_poem_acting}>
      <h2 className={styles.title}>Мастер дубляжа</h2>
      <p className={styles.descr}>
        Примерь на себя неожиданные роли и прокачай харизму через стихи
      </p>

      <div className={styles.screen}>
        {/* ЭКРАН 1: Ожидание (Idle) */}
        {screenStatus === SCREEN_STATUS.IDLE && (
          <PoemActingIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            actingData={randomActing}
            onStart={handleStartActing}
          />
        )}

        {/* ЭКРАН 2: Запись и Чтение (Process) */}
        {screenStatus === SCREEN_STATUS.RUNNING && (
          <PoemActingProcess
            numberRounds={TOTAL_ROUNDS}
            acting={randomActing}
            messages={messages}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
             audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishActing={handleFinishActing}
            onAutoFinish={handleAutoSubmit}
            isAiThinking={isLoading}
          />
        )}

        {/* ЭКРАН 3: Вердикт ИИ-Режиссера (Result) */}
        {screenStatus === SCREEN_STATUS.FINISHED && (
          <PoemActingResult
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

export default PoemActingAi
