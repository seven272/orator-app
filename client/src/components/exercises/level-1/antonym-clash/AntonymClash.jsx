import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
 
import styles from './AntonymClash.module.css'
// Импортируем утилиту генерации из новой структуры папок
import { getRandomClashTask } from '../../../../assets/data/exercises/level1/antonym-clash/utils'
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

// 📌 Оптимальное время раунда для мгновенной инверсии текста на первом уровне
const TOTAL_TIME = 25

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

const AntonymClash = ({ alias, isDaily }) => {
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
  
  // Инициализируем стейт заданием (исходный текст + массив ключей)
  const [task, setTask] = useState(getRandomClashTask())
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
    setTask(getRandomClashTask()) // Генерируем новый текст-перевёртыш
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

  // 📌 Функция подсветки ключевых слов для инверсии смыслов
  const renderHighlightedText = () => {
    const { text, keys } = task
    if (!keys || keys.length === 0) return text

    // Создаем регулярное выражение из ключевых слов с границами слов
    // eslint-disable-next-line no-useless-escape
    const escapedKeys = keys.map(k => k.replace(/[-\/\\^\$*+?.()|[\]{}]/g, '\\$&'))
    const regex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi')
    
    const parts = text.split(regex)
    
    return parts.map((part, index) => {
      const isKey = keys.some(key => key.toLowerCase() === part.toLowerCase())
      return isKey ? (
        <strong key={index} className={styles.highlight_word}>{part}</strong>
      ) : (
        part
      )
    })
  }

  return (
    <div className={styles.main_clash}>
      <h2 className={styles.title}>Риторический Перевёртыш</h2>
      <p className={styles.descr}>Перескажи текст, мгновенно меняя все ключевые слова на антонимы</p>

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

            {/* Блок текста с интерактивной подсветкой целей */}
            <div className={styles.text_container}>
              <p className={styles.reading_text}>{renderHighlightedText()}</p>
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
          <div className={styles.note}>🔄 Меняйте выделенные слова на противоположные!</div>
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
                  <strong>Ваш перевёрнутый ответ:</strong>{' '}
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

export default AntonymClash
