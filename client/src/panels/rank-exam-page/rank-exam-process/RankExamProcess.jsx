import { useEffect, useState, useRef } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle, FaPlay, FaPause } from 'react-icons/fa'
import { AI_STATUS } from '../../../constants/exercises'
import ChatRankExam from './chat-rank-exam/ChatRankExam'
import styles from './RankExamProcess.module.css'

const RankExamProcess = ({
  ticketData,
  messages,
  timeLimit,
  aiStatus,
  audioBlob,
  onStopRecording,
  onStartRecording,
  onFinishExam,
  isAiThinking,
}) => {
  const [timer, setTimer] = useState(timeLimit)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioRef = useRef(null)
  const isCompletedRound = aiStatus === AI_STATUS.FINISHED

  useEffect(() => {
    if (audioBlob && audioBlob.size > 0) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [audioBlob])

  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
      setAudioUrl(null)
      setIsPlaying(false)
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

  const togglePlayAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className={styles.screen_running}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}

      {/* Шапка: прогресс и карточка билета */}
      <div className={styles.exam_header}>
        <div className={styles.progress_row}>
          <span>{isCompletedRound ? 'Выступление записано' : 'Этап: Монолог'}</span>
          <span>Лимит: {timeLimit} сек</span>
        </div>
        <div className={styles.progress_bar_bg}>
          <div
            className={styles.progress_bar_fill}
            style={{ width: isCompletedRound ? '100%' : '50%' }}
          />
        </div>

        {ticketData && (
          <div className={styles.ticket_card}>
            <div className={styles.ticket_topic}>🎫 {ticketData.topic}</div>
            {ticketData.constraints?.length > 0 && (
              <div className={styles.constraints_row}>
                {ticketData.constraints.map((item, idx) => (
                  <span key={idx} className={styles.constraint_tag}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Отдельный компонент чата экзамена */}
      <ChatRankExam
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Нижняя панель управления */}
      <div className={styles.exam_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            type="button"
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
            Начать выступление <CiMicrophoneOn size={24} />
          </button>
        )}

        {aiStatus === AI_STATUS.RECORDING && (
          <div className={styles.recording_wrapper}>
            <div className={styles.pulse_circle} />
            <span className={styles.timer_text}>{timer} сек</span>
            <button
              type="button"
              onClick={onStopRecording}
              className={styles.stop_btn}
            >
              <FaStopCircle size={42} />
            </button>
          </div>
        )}

        {(aiStatus === AI_STATUS.PROCESSING ||
          aiStatus === AI_STATUS.AI_THINKING) && (
          <div className={styles.status_wrapper}>
            <div className={styles.typing_dots}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.status_text}>
              {aiStatus === AI_STATUS.PROCESSING
                ? 'Обработка речи...'
                : 'ИИ-судья анализирует выступление...'}
            </span>
          </div>
        )}

        {isCompletedRound && (
          <div className={styles.finished_actions_group}>
            {audioUrl && (
              <button
                type="button"
                onClick={togglePlayAudio}
                className={`${styles.listen_btn} ${isPlaying ? styles.listen_active : ''}`}
              >
                {isPlaying ? <FaPause size={15} /> : <FaPlay size={15} />}
                <span>{isPlaying ? 'Пауза' : 'Слушать речь'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFinishExam}
              className={styles.finish_btn}
              disabled={isAiThinking}
            >
              Вердикт ИИ-судьи <TbScoreboard size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RankExamProcess
