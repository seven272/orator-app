import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import styles from './TongueTwister.module.css'
import { getRandomWord } from '../../../../utils/getRandomValues'
import { randomTwisters } from '../../../../assets/mocks/similarWords'
import { useSpeech } from '../../../../hooks/useSpeech' //п1
import {
  calculateAccuracy,
  calculateXP,
} from '../../../../utils/compareSpeech'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

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

const TongueTwister = ({ alias, isDaily }) => {
  // Инициализируем наш кастомный хук для работы с микрофоном
  const {
    transcript,
    startListening,
    stopListening,
    isListening,
    resetTranscript,
  } = useSpeech('ru-RU')
  const generator = useMemo(() => getRandomWord(randomTwisters), [])
  const navigate = useNavigate()

  const dispatch = useDispatch()

  // --- СОСТОЯНИЯ КОМПОНЕНТА ---
  const [xp, setXp] = useState(0)
  const [randomWord, setRandomWord] = useState(() => generator()) // Текущая скороговорка
  const [status, setStatus] = useState(STATUS.IDLE) // Статус: idle (ожидание), counting (отсчет), running (процесс), finished (итог)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME) // Таймер самого упражнения (10 сек)
  const [accuracy, setAccuracy] = useState(0) // Процент точности произношения
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
    setAccuracy(0)
  }

  const handleAutoCheckResult = (currentTranscript) => {
    stopListening()

    if (currentTranscript && currentTranscript.trim().length > 0) {
      const res = calculateAccuracy(randomWord, transcript)
      const roundXp = calculateXP(res)
      setAccuracy(res)
      setXp(roundXp)
      dispatch(
        fetchCompleteExercise({
          exAlias: alias,
          score: roundXp,
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

  const clickNext = () => {
    setRandomWord(generator()) // Берем новую фразу
    resetExerciseState()
    setStatus(STATUS.RUNNING)
  }

  // Обработка кнопки "Завершить и выйти"
  const clickStop = () => {
    resetExerciseState()
    navigate(-1)
  }

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
    <div className={styles.main_tongue_twister}>
      <h2 className={styles.title}>Битва дикции</h2>
      <p className={styles.descr}>Прочитай быстро и четко</p>

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

            <div className={styles.words_wrap}>
              <span className={styles.word}>{randomWord}</span>
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
          <div className={styles.note}>🎤 Говорите в микрофон...</div>
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
                <div className={styles.stats_wrap}>
                  <p className={styles.finished_answer}>
                    Точность: <strong>{accuracy}%</strong>
                  </p>
                  {/* Визуальная полоска прогресса */}
                  <progress
                    value={accuracy}
                    max="100"
                    className={styles.progress}
                  ></progress>
                </div>
                <p className={styles.finished_xp}>+{xp} xp</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* блок с нижними кнопками */}
      <ExerciseControls
        status={status}
        STATUS={STATUS}
        level="LEVEL_1"
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

export default TongueTwister
