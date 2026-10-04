import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
 
import styles from './ArgumentSpeed.module.css'
// Импортируем утилиту генерации из новой структуры папок
import { getRandomArgumentTask } from '../../../../assets/data/exercises/level2/argument-speed/utils'
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

// 📌 Таймер изменен на 45 секунд для пулеметной аргументации
const TOTAL_TIME = 45

const SCORING_LABELS = {
  50: 'Отлично 🎉',
  30: 'Хороший темп 👍',
  15: 'Маловато аргументов 😅',
  0: 'Задание не пройдено',
}

const isSpeechSupported = !!(
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
)

const ArgumentSpeed = ({ alias, isDaily }) => {
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
  // Инициализируем стейт заданием (тезис + позиция ЗА/ПРОТИВ)
  const [task, setTask] = useState(getRandomArgumentTask())
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
      // Для 2 уровня награда составляет 50 XP
      setXp(50)
      dispatch(
        fetchCompleteExercise({
          exAlias: alias,
          score: 50, 
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
    setTask(getRandomArgumentTask()) // Генерируем новый тезис и позицию
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

  return (
    <div className={styles.main_speed}>
      <h2 className={styles.title}>Пулемет аргументов</h2>
      <p className={styles.descr}>Выдай максимальное количество аргументов за ограниченное время</p>

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

            {/* Блок отображения тезиса и выданной роли */}
            <div className={styles.task_container}>
              <div className={styles.thesis_block}>
                <span className={styles.label}>Тезис:</span>
                <p className={styles.thesis_text}>«{task.thesis}»</p>
              </div>
              
              <div className={styles.position_badge_wrap}>
                <span className={styles.position_label}>Ваша позиция:</span>
                <span 
                  className={`${styles.position_value} ${
                    task.position === 'ЗА' ? styles.pos_pro : styles.pos_contra
                  }`}
                >
                  {task.position}
                </span>
              </div>
            </div>

            <div className={styles.live_transcript}>
              {transcript
                ? transcript
                : isListening
                  ? 'Слушаю вашу речь...'
                  : '🎤 Микрофон не активен'}
            </div>
          </div>
        )}

        {isListening && status === STATUS.RUNNING && (
          <div className={styles.note}>🎤 Говорите без долгих пауз...</div>
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
                  <strong>Ваш спич:</strong>{' '}
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

export default ArgumentSpeed
