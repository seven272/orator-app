import { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import styles from './Emotion.module.css'
import { getRandomWord } from '../../../../utils/getRandomValues'
import {
  emotions,
  neutralPhrases,
} from '../../../../assets/mocks/similarWords'
import { useSpeech } from '../../../../hooks/useSpeech'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_TIME = 10

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

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

const Emotion = ({ alias, isDaily }) => {
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
  // Генераторы для фраз и эмоций
  const phraseGenerator = useMemo(
    () => getRandomWord(neutralPhrases),
    [],
  )
  const emotionGenerator = useMemo(() => getRandomWord(emotions), [])
  const [currentPhrase, setCurrentPhrase] = useState(() =>
    phraseGenerator(),
  )
  const [currentEmotion, setCurrentEmotion] = useState(() =>
    emotionGenerator(),
  )
  const [status, setStatus] = useState(STATUS.IDLE)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    status === STATUS.RUNNING ? startListening() : stopListening()
  }, [status, startListening, stopListening])

  const handleInterrupt = () => {
    setStatus(STATUS.FINISHED)
    setIsTaskInterrupted(true)
  }

  // Сброс состояния для нового круга
  const resetExerciseState = () => {
    setTimeLeft(TOTAL_TIME)
    setXp(0)
    resetTranscript()
    setIsTaskInterrupted(false)
  }
  const handleAutoCheckResult = (currentTranscript) => {
    stopListening()
    // Если пользователь что-то сказал — автоматически начисляем 30 баллов и шлем на бэк
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

  const clickNext = () => {
    setCurrentPhrase(phraseGenerator())
    setCurrentEmotion(emotionGenerator())
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
    <div className={styles.main_emotion}>
      <h2 className={styles.title}>Эмоциональный окрас</h2>
      <p className={styles.descr}>
        Прочитай фразу с указанной эмоцией
      </p>

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
              <span className={styles.word_simple}> {currentEmotion}</span>
              <span className={styles.word}> {currentPhrase}</span>
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
          <div className={styles.note}>
            🎤 Постарайся передать характер голосом
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
        level="LEVEL_1"
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

export default Emotion
