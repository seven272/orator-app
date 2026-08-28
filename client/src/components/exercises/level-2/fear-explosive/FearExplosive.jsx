import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { PiTimer } from 'react-icons/pi'

import { fearScenarios } from '../../../../assets/mocks/similarWords'
import { useAudioRecorder } from '../../../../hooks/useAudioRecorder'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'
import styles from './FearExplosive.module.css'

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}

const TOTAL_TIME = 10

const SCORING_LABELS = {
  50: 'Отлично 🎉',
  25: 'Неплохо, но можно лучше 👍',
  5: 'Нужно тренироваться 😅',
  0: 'Задание не пройдено',
}

const FearExplosive = ({ alias, isDaily }) => {
  const {
    audioUrl,
    startRecording,
    stopRecording,
    resetAudio,
    isSupported,
  } = useAudioRecorder()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [randomTask, setRandomTask] = useState(null)
  const [poolTasks, setPoolTasks] = useState([])
  const [status, setStatus] = useState(STATUS.IDLE)
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME)
  const [xp, setXp] = useState(0)
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Инициализация
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      fearScenarios,
    )
    setRandomTask(selectedItem)
    setPoolTasks(newPool)
  }, [])

  useEffect(() => {
    if (status === STATUS.RUNNING) {
      //если возникла ошибка при старте записи, то статус тренажера сбрасывается к изначальному
      startRecording().catch(() => setStatus(STATUS.IDLE))
    } else if (status === STATUS.FINISHED) {
      stopRecording()
    }
  }, [status, startRecording, stopRecording])

  useEffect(() => {
    let timer
    if (status === STATUS.RUNNING && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && status === STATUS.RUNNING) {
      setStatus(STATUS.FINISHED)
    }
    return () => clearInterval(timer)
  }, [status, timeLeft])

  // Сброс состояния для нового круга
  const resetExerciseState = () => {
    setTimeLeft(TOTAL_TIME)
    setXp(0)
    resetAudio()
    setIsTaskInterrupted(false)
    setStatus(STATUS.RUNNING)
    const { selectedItem, newPool } = getRandomObjTask(
      poolTasks,
      fearScenarios,
    )
    setRandomTask(selectedItem)
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
    resetExerciseState()
  }

  const clickStop = () => {
    navigate(-1)
  }

  if (!randomTask) return <ScreenSpinner />

  return (
    <div className={styles.main_fear}>
      <h2 className={styles.title}>Громкий вызов</h2>
      <p className={styles.descr}>
        Уровень громкости должен максимально соответсвовать условию
        задания
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

            {!isSupported && status === STATUS.IDLE ? (
              <span className={styles.idle_warning}>
                Ваш браузер не поддерживает запись голоса. Выполните
                задание вслух и оцените себя самостоятельно в конце.
              </span>
            ) : (
              <span className={styles.idle_warning}>
                После завершения задания можно будет прослушать
                аудиозапись
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
              <span className={styles.task_title}>
                {randomTask.situation}
              </span>
              <span className={styles.task_descr}>
                {randomTask.instruction}
              </span>
            </div>

            <span className={styles.note}>
              🎤 Записываем ваш вариант...
            </span>
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
                  <span className={styles.audio_title}>
                    Готово! Прослушайте и проанализируйте запись.
                  </span>
                  {audioUrl && (
                    <audio
                      src={audioUrl}
                      controls
                      className={styles.audio_pleer}
                    />
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

export default FearExplosive
