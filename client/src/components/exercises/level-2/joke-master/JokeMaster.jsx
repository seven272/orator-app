import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { PiTimer } from 'react-icons/pi'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import { jokeScenarios } from '../../../../assets/mocks/jokeScenarios'
import { useAudioRecorder } from '../../../../hooks/useAudioRecorder'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import styles from './JokeMaster.module.css'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

const TOTAL_TIME = 25

const SCORING_LABELS = {
  50: 'Отлично 🎉',
  25: 'Неплохо, но можно лучше 👍',
  5: 'Нужно тренироваться 😅',
  0: '',
}

const JokeMaster = ({ alias, isDaily }) => {
  const {
    audioUrl,
    startRecording,
    stopRecording,
    resetAudio,
    isSupported,
  } = useAudioRecorder()

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [scenario, setScenario] = useState(null)
  const [poolTasks, setPoolTasks] = useState([])
  const [status, setStatus] = useState(STATUS.IDLE)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [xp, setXp] = useState(0)
  const [showOriginal, setShowOriginal] = useState(false)
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Инициализация первого анекдота
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      jokeScenarios,
    )
    setScenario(selectedItem)
    setPoolTasks(newPool)
  }, [])

  // Управление записью
  useEffect(() => {
    if (status === STATUS.RUNNING) {
      startRecording().catch(() => setStatus(STATUS.IDLE))
    } else if (status === STATUS.FINISHED) {
      stopRecording()
    }
  }, [status, startRecording, stopRecording])

  // Таймер
  useEffect(() => {
    let timer
    if (status === STATUS.RUNNING && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && status === STATUS.RUNNING) {
      setStatus(STATUS.FINISHED)
    }
    return () => clearInterval(timer)
  }, [status, timeLeft])

  const resetExerciseState = () => {
    setTimeLeft(TOTAL_TIME)
    setXp(0)
    setShowOriginal(false)
    resetAudio()
    setIsTaskInterrupted(false)
    setStatus(STATUS.RUNNING)
    const { selectedItem, newPool } = getRandomObjTask(
      poolTasks,
      jokeScenarios,
    )
    setScenario(selectedItem)
    setPoolTasks(newPool)
  }

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
    setShowOriginal(false)
    resetExerciseState()
  }

  const clickStop = () => {
    navigate(-1)
  }

  if (!scenario) return <ScreenSpinner />

  return (
    <div className={styles.main_joke_master}>
      <h2 className={styles.title}>Импровизатор анекдотов</h2>
      <p className={styles.descr}>
        Придумай свою смешную концовку к анекдоту
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
              Как шутить?
            </button>
            {!isSupported && status === STATUS.IDLE ? (
              <span className={styles.idle_warning}>
                Ваш браузер не поддерживает запись голоса. Выполните
                задание вслух и оцените себя самостоятельно в конце.
              </span>
            ) : (
              <span className={styles.idle_warning}>
                У вас будет 25 секунд, чтобы придумать и записать
                финал истории
              </span>
            )}
          </div>
        )}

        {status === STATUS.RUNNING && (
          <div className={styles.screen_running}>
            <div className={styles.content_wrap}>
              <span className={styles.content_label}>
                Ваша завязка:
              </span>
              <span className={styles.content_text}>
                {scenario.setup}
              </span>
            </div>

            <div className={styles.timer}>
              <PiTimer size={30} />
              {timeLeft} сек
            </div>

            <span className={styles.note}>
              🎤 Записываем ваш вариант...
            </span>
          </div>
        )}

        {status === STATUS.FINISHED && (
          <div className={styles.screen_finished}>
            {isTaskInterrupted && (
              <span className={styles.finished_text}>
                Задание прервано
              </span>
            )}

            {xp === 0 && !isTaskInterrupted ? (
              <>
                <div className={styles.audio_wrap}>
                  <span className={styles.audio_title}>
                    Ваша импровизация:
                  </span>
                  {audioUrl && (
                    <audio
                      src={audioUrl}
                      controls
                      className={styles.audio_pleer}
                    />
                  )}
                </div>
                {!showOriginal ? (
                  <button
                    className={styles.btn_show}
                    onClick={() => setShowOriginal(true)}
                  >
                    Узнать оригинал
                  </button>
                ) : (
                  <div className={styles.original_wrap}>
                    <p className={styles.original_label}>
                      Оригинальный панчлайн:
                    </p>
                    <h2 className={styles.original_text}>
                      {scenario.punchline}
                    </h2>
                  </div>
                )}
                {showOriginal && (
                  <span className={styles.finished_question}>
                    Чей вариант смешнее? Оцените себя:
                  </span>
                )}
              </>
            ) : (
              <>
                <span className={styles.finished_text}>
                  {SCORING_LABELS[xp]}
                </span>
                <p className={styles.finished_xp}>+{xp} xp</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Блок с нижними кнопками */}
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

export default JokeMaster
