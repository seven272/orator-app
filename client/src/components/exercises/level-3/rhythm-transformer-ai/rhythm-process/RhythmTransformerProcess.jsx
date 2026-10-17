import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import styles from './RhythmTransformerProcess.module.css'
import { AI_STATUS } from '../../../../../constants/exercises'

const RhythmTransformerProcess = ({
  numberRounds,
  scenario,
  currentText,
  articulationProgress,
  timeLimit,
  aiStatus,
  onStopRecording,
  onStartRecording,
  onFinishDialog,

}) => {

  const [timer, setTimer] = useState(timeLimit)

  // Вычисляем текущий раунд на основе текстовых итераций (каждый раунд подменяет строку)
  const currentRound = scenario.round_1 === currentText ? 0 : scenario.round_2 === currentText ? 1 : 2
  const progress = (currentRound / numberRounds) * 100

  // Если все три уровня текста пройдены, переводим статус в финал
  useEffect(() => {
    if (currentRound >= numberRounds - 1 && aiStatus === AI_STATUS.FINISHED) {
      // Статус уже выставлен
    }
  }, [currentRound, numberRounds, aiStatus])

  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  useEffect(() => {
    let interval
    if (aiStatus === AI_STATUS.RECORDING && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    }
    if (timer === 0 && aiStatus === AI_STATUS.RECORDING) {
      onStopRecording()
    }
    return () => clearInterval(interval)
  }, [aiStatus, timer, onStopRecording])

  return (
    <div className={styles.screen_running}>
      {/* Абстрактная верхняя панель прогресса */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {aiStatus === AI_STATUS.FINISHED 
                ? 'Чтение завершено' 
                : `Уровень усложнения ${currentRound + 1} из ${numberRounds}`}
            </div>
            <div className={styles.bar_bg}>
              <div className={styles.bar_fill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Четкость артикуляции: {articulationProgress}%</span>
            <div className={styles.bar_bg}>
              <div className={styles.articulation_bar_fill} style={{ width: `${articulationProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер фокуса контроля букв */}
      <div className={styles.target_box}>
        <span className={styles.target_title}>Фокус дикционного контроля:</span>
        <p className={styles.target_text}>{scenario.prosecutor_focus}</p>
      </div>

      {/* КРУПНЫЙ ИНТЕРАКТИВНЫЙ БЛОК ДЛЯ ЧТЕНИЯ С ЭКРАНА */}
      <div className={styles.text_display_container}>
        <div className={`${styles.speech_card} ${aiStatus === AI_STATUS.RECORDING ? styles.speech_card_active : ''}`}>
          <p className={styles.speech_text_to_read}>
            {aiStatus === AI_STATUS.FINISHED ? 'Все раунды успешно прочитаны. Нажмите на кнопку ниже, чтобы отправить запись ИИ-логопеду на детальный буквенный аудит.' : currentText}
          </p>
        </div>
      </div>

      {/* Универсальный футер контроля записи */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_btn}>
            Прочитать раунд <CiMicrophoneOn size={25} />
          </button>
        )}

        {aiStatus === AI_STATUS.RECORDING && (
          <div className={styles.recording_wrapper}>
            <div className={styles.pulse_circle}></div>
            <span className={styles.timer_text}>{timer} сек</span>
            <button onClick={onStopRecording} className={styles.stop_btn}>
              <FaStopCircle size={45} />
            </button>
          </div>
        )}

        {(aiStatus === AI_STATUS.PROCESSING || aiStatus === AI_STATUS.AI_THINKING) && (
          <div className={styles.status_wrapper}>
            <div className={styles.typing_dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.status_text}>
              {aiStatus === AI_STATUS.PROCESSING ? 'Сканируем слоги...' : 'Метроном перестраивает ритм...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.finish_btn}>
            Получить разбор логопеда <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default RhythmTransformerProcess
