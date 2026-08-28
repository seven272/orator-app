import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import styles from './JargonTask.module.css'
import { jargonTasks } from '../../../../assets/mocks/jargonTasks'
import { useSpeech } from '../../../../hooks/useSpeech'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_TIME = 15

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

const SCORING_LABELS = {
  50: 'Отлично 🎉',
  25: 'Неплохо, но можно лучше 👍',
  5: 'Нужно тренироваться 😅',
  0: 'Задание не пройдено',
}

const isSpeechSupported = !!(
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
)

const JargonTask = ({ alias, isDaily }) => {
  const {
    transcript,
    startListening,
    stopListening,
    isListening,
    resetTranscript,
  } = useSpeech('ru-RU')

  const dispatch = useDispatch()
   const navigate = useNavigate()

  const [randomTask, setRandomTask] = useState(null)
  const [poolTasks, setPoolTasks] = useState([])
  const [xp, setXp] = useState(0)
  const [status, setStatus] = useState(STATUS.IDLE) // idle, counting, running, finished
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
      // Простая логика валидации: ищем вхождение корней из validationKeywords в transcript
      const lowerTranscript = currentTranscript.toLowerCase()
      const foundKeywords = randomTask.validationKeywords.filter(
        (word) => lowerTranscript.includes(word.toLowerCase()),
      )
      const isSuccess =
        foundKeywords.length >= randomTask.settings.minKeywords
      // Начисление XP (50 или 5)
      const earnedXP = isSuccess ? 50 : 0
      setXp(earnedXP)
      dispatch(
        fetchCompleteExercise({
          exAlias: alias,
          score: earnedXP,
          isDaily: isDaily,
        }),
      )
    }
    // Если транскрипт пуст — ничего не отправляем, стейт xp остается 0, ждем ручного выбора юзера
  }

  // Ручная фиксация и отправка при клике на оценку себя
  const handleManualRate = (selectedXp) => {
    setXp(selectedXp) // Сохраняем в стейт для отображения в интерфейсе
    // отправляем этот выбранный балл на бэкенд
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

  // логика получения новой задачи
  const clickNext = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolTasks,
      jargonTasks,
    )
    setRandomTask(selectedItem)
    setPoolTasks(newPool)
    resetExerciseState()
    setStatus(STATUS.RUNNING)
  }

  const clickStop = () => {
    navigate(-1)
  }

  //получаю фразу при первом рендере компонента
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      jargonTasks,
    )
    setRandomTask(selectedItem)
    setPoolTasks(newPool)
  }, [])

  // логика основного таймера
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
    <div className={styles.main_jargon_exercise}>
      <h2 className={styles.title}>Блатной базар</h2>
      <p className={styles.descr}>
        Проговорите задание, используя слова-теги
      </p>

      {/* показываю начальный экран */}
      <div className={styles.screen}>
        {status === STATUS.IDLE && (
          <div className={styles.screen_idle}>
            <span className={styles.text_start}>Приготовиться</span>

            <button
              className={styles.btn_theory}
              onClick={() => setShowModal(true)}
            >
              <Icon20InfoCircleOutline
                className={styles.theory_icon}
              />
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

            <div className={styles.task_wrap}>
              <span className={styles.task_question}>
                {randomTask.situation}
              </span>
              <span className={styles.tags_title}>
                Используй в ответе слова ниже
              </span>

              <div className={styles.tags}>
                {randomTask.displayWords.map((elem, inx) => (
                  <span key={inx} className={styles.tag}>
                    {elem}{' '}
                  </span>
                ))}
              </div>
            </div>

            {/* Отображаем transcript, если он пустой - выводим статус */}
            <div className={styles.live_transcript}>
              {transcript
                ? transcript
                : isListening
                  ? 'Слушаю...'
                  : 'Микрофон не активен'}
            </div>
          </div>
        )}
        {/* Показываем надпись "Говорите", когда микрофон реально включен */}
        {isListening && status === STATUS.RUNNING && (
          <span className={styles.note}>
            🎤 Говори максимально дерзко и уверенно
          </span>
        )}

        {status === STATUS.FINISHED && (
          <div className={styles.screen_finished}>
            {/* Если прервал или ничего не сказал - даем оценить самому */}
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
                  <strong>Ваш ответ:</strong>{' '}
                  {transcript || 'Запись не велась'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* блок с нижними кнопками */}
      <ExerciseControls
        status={status}
        STATUS={STATUS}
        xp={xp}
        isTaskInterrupted={isTaskInterrupted}
        onStart={() => setStatus(STATUS.RUNNING)}
        onStop={handleInterrupt}
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

export default JargonTask
