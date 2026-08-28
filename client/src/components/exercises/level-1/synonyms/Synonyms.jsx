import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import styles from './Synonyms.module.css'
import { getRandomWord } from '../../../../utils/getRandomValues'
import { similarWords } from '../../../../assets/mocks/similarWords'
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

const TOTAL_TIME = 10

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

const Synonyms = ({ alias, isDaily }) => {
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
  const wordGenerator = useMemo(() => getRandomWord(similarWords), [])
  const [randomWord, setRandomWord] = useState(() => wordGenerator())
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
    let foundSynonyms = []
    if (currentTranscript) {
      const words = currentTranscript
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 2) // Игнорируем предлоги и короткий мусор
      foundSynonyms = [...new Set(words)]
    }

    const count = foundSynonyms.length
    const earnedXP = count === 0 ? 0 : Math.min(count * 6, 30)
    setXp(earnedXP)
    dispatch(
      fetchCompleteExercise({
        exAlias: alias,
        score: earnedXP,
        isDaily: isDaily,
      }),
    )
  }

  // Ручная фиксация и отправка при клике на оценку себя
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

  // --- ЛОГИКА ОБРАБОТКИ СЛОВ ---
  const realTimeSynonyms = useMemo(() => {
    if (!transcript) return []
    // Разбиваем строку на слова, убираем знаки препинания и лишние пробелы
    const words = transcript
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2) // Игнорируем предлоги и короткий мусор

    // Оставляем только уникальные слова
    return [...new Set(words)]
  }, [transcript])

  const handleInterrupt = () => {
    setStatus(STATUS.FINISHED)
    setIsTaskInterrupted(true)
  }

  const clickNext = () => {
    // Генерируем новое слово и сбрасываем состояние раунда
    setRandomWord(wordGenerator())
    resetExerciseState()
    setStatus(STATUS.RUNNING)
  }

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
    <div className={styles.main_synonyms}>
      <h2 className={styles.title}>Синонимайзер</h2>
      <p className={styles.descr}>Назови 5 синонимов к слову</p>

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

            {/* Счетчик слов в реальном времени */}
            <div className={styles.counter}>
              Найдено слов: <span>{realTimeSynonyms.length}</span>
            </div>

            <div className={styles.chips_wrap}>
              {realTimeSynonyms.map((word, i) => (
                <span key={i} className={styles.chip}>
                  {word}
                  {'-'}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Показываем надпись "Говорите", когда микрофон реально включен */}
        {status === STATUS.RUNNING && (
          <div className={styles.note}>
            {isListening
              ? '🎤 Говорите в микрофон...'
              : '🎤 Микрофон не активен'}
          </div>
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
                  {!transcript
                    ? SCORING_LABELS[xp]
                    : xp < 30
                      ? 'Неплохо, но можно лучше 👍'
                      : 'Отлично 🎉'}
                </span>
                <p className={styles.finished_xp}>+{xp} xp</p>
                <span className={styles.finished_answer}>
                  {transcript ? (
                    <span>
                      Найдено слов:
                      <strong>{realTimeSynonyms.length}</strong>
                    </span>
                  ) : (
                    ''
                  )}
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

export default Synonyms
