import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
 
import styles from './SpeechPace.module.css'
// Импортируем утилиту генерации и данные темпов из новой структуры папок
import { getRandomPaceTask } from '../../../../assets/data/exercises/level1/speech-pace/utils'
import { speechPaceData } from '../../../../assets/data/exercises/level1/speech-pace/data'
import { useSpeech } from '../../../../hooks/useSpeech'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

const TOTAL_TIME = 20
const PACE_CHANGE_INTERVAL = 7 // Интервал смены темпа в секундах

const SCORING_LABELS = {
  30: 'Отлично 🎉',
  15: 'Неплохо, но можно лучше 👍',
  5: 'Нужно тренироваться 😅',
  0: 'Задание не пройдено',
}

const isSpeechSupported = !!(
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
)

const SpeechPace = ({ alias, isDaily }) => {
  const {
    transcript,
    startListening,
    stopListening,
    isListening,
    resetTranscript,
  } = useSpeech('ru-RU')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [xp, setXp] = useState(0)
  
  // Инициализация текста
  const [task, setTask] = useState(getRandomPaceTask())
  // Инициализация темпа (по дефолту берём НОРМАЛЬНО — индекс 1)
  const [currentPace, setCurrentPace] = useState(speechPaceData.paces[1])
  
  const [status, setStatus] = useState(STATUS.IDLE)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Реф для отслеживания времени с момента последней смены темпа
  const paceSecondsRef = useRef(0)

  // Управление микрофоном
  useEffect(() => {
    status === STATUS.RUNNING ? startListening() : stopListening()
  }, [status, startListening, stopListening])

  // Сброс состояния для нового круга
  const resetExerciseState = () => {
    setTimeLeft(TOTAL_TIME)
    setXp(0)
    resetTranscript()
    setIsTaskInterrupted(false)
    setCurrentPace(speechPaceData.paces[1]) // Сброс на дефолтный темп
    paceSecondsRef.current = 0
  }

  const handleAutoCheckResult = (currentTranscript) => {
    stopListening()
    if (currentTranscript && currentTranscript.trim().length > 0) {
      setXp(30)
      dispatch(
        fetchCompleteExercise({
          exAlias: alias,
          score: 30, 
          isDaily: isDaily,
        }),
      )
    }
  }

  const handleManualRate = (selectedXp) => {
    setXp(selectedXp)
    dispatch(
      fetchCompleteExercise({
        exAlias: alias,
        score: selectedXp,
        isDaily: isDaily,
      }),
    )
  }

  const handleInterrupt = () => {
    setStatus(STATUS.FINISHED)
    setIsTaskInterrupted(true)
  }

  const handleCompleteReady = () => {
    setStatus(STATUS.FINISHED)
    handleAutoCheckResult(transcript)
  }

  // Функция случайной смены темпа, исключая текущий для динамики
  const changeRandomPace = () => {
    const availablePaces = speechPaceData.paces.filter(p => p.label !== currentPace.label)
    const randomIndex = Math.floor(Math.random() * availablePaces.length)
    setCurrentPace(availablePaces[randomIndex])
  }

  const clickNext = () => {
    setTask(getRandomPaceTask())
    resetExerciseState()
    setStatus(STATUS.RUNNING)
  }

  const clickStop = () => {
    resetExerciseState()
    navigate(-1) 
  }

  // Логика основного таймера и смены темпа
  useEffect(() => {
    let timer
    if (status === STATUS.RUNNING) {
      if (timeLeft > 0) {
        timer = setInterval(() => {
          setTimeLeft((prev) => prev - 1)
          paceSecondsRef.current += 1

          // Каждые 7 секунд меняем темп
          if (paceSecondsRef.current >= PACE_CHANGE_INTERVAL) {
            changeRandomPace()
            paceSecondsRef.current = 0
          }
        }, 1000)
      } else {
        setStatus(STATUS.FINISHED)
        handleAutoCheckResult(transcript)
      }
    }
    return () => clearInterval(timer)
  }, [status, timeLeft, currentPace])

  // Вычисляем скорость анимации маятника на основе BPM текущего темпа
  // 60 сек / BPM = длительность одного удара (импульса)
  const pulseDuration = `${60 / currentPace.bpm}s`

  return (
    <div className={styles.main_pace}>
      <h2 className={styles.title}>Метроном</h2>
      <p className={styles.descr}>Читай текст, подстраиваясь под меняющийся темп метронома</p>

      <div className={styles.screen}>
        {status === STATUS.IDLE && (
          <div className={styles.screen_idle}>
            <span className={styles.text_start}>Приготовиться</span>

            <button
              className={styles.btn_theory}
              onClick={() => setShowModal(true)}
            >
              <Icon20InfoCircleOutline className={styles.theory_icon} />
              Ознакомиться с теорией
            </button>

            {!isSpeechSupported && status === STATUS.IDLE && (
              <span className={styles.warning}>
                Ваш браузер не поддерживает запись голоса. Выполните
                задание вслух и оцените себя самостоятельно в конце.
              </span>
            )}
          </div>
        )}

        {status === STATUS.RUNNING && (
          <div className={styles.screen_running}>
            <div className={styles.timer}>
              <PiTimer size={30} /> {timeLeft} сек
            </div>

            {/* Интерактивный блок метронома */}
            <div className={styles.metro_container}>
              <div 
                className={styles.metro_badge} 
                style={{ backgroundColor: currentPace.color }}
              >
                {currentPace.label}
              </div>
              
              {/* Пульсирующий круг-маятник, скорость которого задается через style */}
              <div 
                className={styles.metro_pulsar}
                style={{ 
                  animationDuration: pulseDuration,
                  backgroundColor: currentPace.color 
                }}
              />
            </div>

            {/* Карточка с текстом для чтения */}
            <div className={styles.text_container}>
              <p className={styles.reading_text}>{task.text}</p>
            </div>

            <div className={styles.live_transcript}>
              {transcript
                ? transcript
                : isListening
                  ? 'Слушаю...'
                  : '🎤 Микрофон не активен'}
            </div>
          </div>
        )}

        {isListening && status === STATUS.RUNNING && (
          <div className={styles.note}>🎤 Управляйте скоростью речи под темп...</div>
        )}

        {status === STATUS.FINISHED && (
          <div className={styles.screen_finished}>
            {xp === 0 && !isTaskInterrupted ? (
              <span className={styles.finished_question}>
                Как вы оцениваете результат?
              </span>
            ) : isTaskInterrupted ? (
              <span className={styles.finished_text}>
                Задание прервано
              </span>
            ) : (
              <div className={styles.finished_block_result}>
                <span className={styles.finished_text}>
                  {SCORING_LABELS[xp]}
                </span>
                <p className={styles.finished_xp}>+{xp} xp</p>
                <span className={styles.finished_answer}>
                  <strong>Ваша запись:</strong>{' '}
                  {transcript || 'Запись не велась'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <ExerciseControls
        status={status}
        STATUS={STATUS}
        exAlias={alias}
        xp={xp}
        isTaskInterrupted={isTaskInterrupted}
        onStart={() => setStatus(STATUS.RUNNING)}
        onStop={handleInterrupt}
        onComplete={handleCompleteReady}
        onRate={handleManualRate}
        onFinish={clickStop}
        onNext={clickNext}
      />
      
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default SpeechPace
