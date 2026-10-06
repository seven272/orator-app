import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
 
import styles from './BreathControl.module.css'
// Импортируем утилиту генерации из новой структуры папок
import { getRandomBreathTask } from '../../../../assets/data/exercises/level1/breath-control/utils'
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

// 📌 Оптимальное время для удержания одного выдоха на первом уровне сложности
const TOTAL_TIME = 15

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

const BreathControl = ({ alias, isDaily }) => {
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
  
  // Инициализируем стейт заданием (текст + сложность)
  const [task, setTask] = useState(getRandomBreathTask())
  const [status, setStatus] = useState(STATUS.IDLE)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

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

  const clickNext = () => {
    setTask(getRandomBreathTask()) // Генерируем новое текстовое задание
    resetExerciseState()
    setStatus(STATUS.RUNNING)
  }

  const clickStop = () => {
    resetExerciseState()
    navigate(-1) 
  }

  // Логика основного таймера
  useEffect(() => {
    let timer
    if (status === STATUS.RUNNING) {
      if (timeLeft > 0) {
        timer = setInterval(
          () => setTimeLeft((prev) => prev - 1),
          1000,
        )
      } else {
        setStatus(STATUS.FINISHED)
        handleAutoCheckResult(transcript)
      }
    }
    return () => clearInterval(timer)
  }, [status, timeLeft])

  // 📌 Расчет процента оставшегося воздуха для прогресс-бара
  const progressPercent = (timeLeft / TOTAL_TIME) * 100

  return (
    <div className={styles.main_breath}>
      <h2 className={styles.title}>Выдох-Контроль</h2>
      <p className={styles.descr}>Прочитай длинный текст или стихотворение на одном дыхании</p>

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

            {/* Блок прогресс-бара выдоха */}
            <div className={styles.progress_container}>
              <span className={styles.progress_label}>Запас воздуха</span>
              <div className={styles.progress_track}>
                <div 
                  className={styles.progress_bar} 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className={styles.difficulty_badge}> Сложность: {task.difficulty}</span>
            </div>

            {/* Карточка с кумулятивным текстом для чтения */}
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
          <div className={styles.note}>💨 Читайте плавно на одном выдохе...</div>
        )}

        {status === STATUS.FINISHED && (
          <div className={styles.screen_finished}>
            {xp === 0 && !isTaskInterrupted ? (
              <span className={styles.finished_question}>
                Удалось ли продержаться без дополнительного вдоха?
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
                  <strong>Ваш текст:</strong>{' '}
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

export default BreathControl
