import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { PiTimer } from 'react-icons/pi'

import { toastScenarios } from '../../../../assets/mocks/similarWords'
import { useAudioRecorder } from '../../../../hooks/useAudioRecorder'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'
import { fetchCompleteExercise } from '../../../../redux/slices/exerciseSlice'
import ExerciseControls from '../../../exercise-controls/ExerciseControls'
import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'
import styles from './ToastMaster.module.css'

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  FINISHED: 'finished',
}
const TOTAL_TIME = 60

const SCORING_LABELS = {
  50: 'Отлично 🎉',
  25: 'Неплохо, но можно лучше 👍',
  5: 'Нужно тренироваться 😅',
  0: 'Задание не пройдено',
}

const ToastMaster = ({ alias, isDaily }) => {
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
  const [isTaskInterrupted, setIsTaskInterrupted] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Инициализация тоста
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      toastScenarios,
    )
    setScenario(selectedItem)
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

  const phaseInfo = useMemo(() => {
    const elapsed = TOTAL_TIME - timeLeft
    if (elapsed < 20)
      return {
        label: 'Вступление',
        hint: 'Поприветствуйте и назовите повод',
        step: 0,
      }
    if (elapsed < 40)
      return {
        label: 'История',
        hint: 'Расскажите случай или общее воспоминание',
        step: 1,
      }
    return {
      label: 'Пожелание',
      hint: 'Яркий финал и призыв поднять бокалы',
      step: 2,
    }
  }, [timeLeft])

  // Сброс состояния для нового круга
  const resetExerciseState = () => {
    setTimeLeft(TOTAL_TIME)
    setXp(0)
    resetAudio()
    setIsTaskInterrupted(false)
    setStatus(STATUS.RUNNING)
    const { selectedItem, newPool } = getRandomObjTask(
      poolTasks,
      toastScenarios,
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
    resetExerciseState()
  }

  const clickStop = () => {
    navigate(-1)
  }

  if (!scenario) return <ScreenSpinner />

  return (
    <div className={styles.main_toast_master}>
      <h2 className={styles.title}>Мастер тостов</h2>
      <p className={styles.descr}>
        Произнеси тост по схеме повод - история - пожелание
      </p>
      {/* Прогресс-бар */}
      {status !== STATUS.IDLE && (
        <div className={styles.progress_container}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${styles.progress_segment} ${phaseInfo.step >= i ? styles.active : ''}`}
            />
          ))}
        </div>
      )}

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
              <span className={styles.warning}>
                Ваш браузер не поддерживает запись голоса. Выполните
                задание вслух и оцените себя самостоятельно в конце.
              </span>
            ) : (
              <span className={styles.warning}>
                После завершения задания можно будет прослушать
                аудиозапись
              </span>
            )}
          </div>
        )}

        {status === STATUS.RUNNING && (
          <div className={styles.screen_running}>
            <div className={styles.box_phase}>
              <span className={styles.phase_label}>
                {phaseInfo.label}
              </span>
              <p className={styles.phase_text}>{phaseInfo.hint}</p>
            </div>

            <div className={styles.timer}>
              <PiTimer size={30} /> {timeLeft} сек
            </div>

            <div className={styles.box_scenario}>
              <p className={styles.scenario_label}>Ваша ситуация:</p>
              <h2 className={styles.scenario_title}>
                {scenario.title}
              </h2>
              <span className={styles.scenario_descr}>
                {scenario.context}
              </span>
            </div>
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
                    Тост готов! Прослушайте и проанализируйте запись.
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

export default ToastMaster
