import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import { useSpeechSber } from '../../hooks/useSpeechSber'
import { SCREEN_STATUS, AI_STATUS } from '../../constants/exercises'
import {
  setRankExamAiStatus,
  resetRankExamState,
  fetchStartRankExam,
  fetchResponseRankExam,
  fetchFinishRankExam,
} from '../../redux/slices/rankExamSlice'
import RankExamIdle from './rank-exam-idle/RankExamIdle'
import RankExamProcess from './rank-exam-process/RankExamProcess'
import RankExamResult from './rank-exam-result/RankExamResult'
import RankExamGate from './rank-exam-gate/RankExamGate'
import styles from './RankExamPage.module.css'

const EXAM_TITLES_MAP = {
  'exam-confident': {
    title: 'Экзамен: Идеальный питч',
    descr: 'Ранг «Уверенный» • Порог сдачи: > 80 баллов',
    defaultTime: 60,
  },
  'exam-pro': {
    title: 'Экзамен: Адвокат идеи',
    descr: 'Ранг «Профи» • Порог сдачи: > 80 баллов',
    defaultTime: 75,
  },
  'exam-master': {
    title: 'Экзамен: Антикризисное обращение',
    descr: 'Ранг «Мастер» • Порог сдачи: > 80 баллов',
    defaultTime: 90,
  },
  'exam-legend': {
    title: 'Экзамен: Главная сцена TED',
    descr: 'Ранг «Легенда» • Порог сдачи: > 80 баллов',
    defaultTime: 120,
  },
}

const RankExamPage = () => {
  const { alias } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    startListening,
    stopListening,
    audioBlob,
    resetTranscript,
  } = useSpeechSber()

  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)

  const {
    examMeta,
    ticketData,
    messages,
    exStatus,
    aiStatus,
    userSpeech,
    error,
  } = useSelector((state) => state.rankExam)

  const { user } = useSelector((state) => state.profile)

  const isLoading = exStatus === 'loading'
  const headerInfo = EXAM_TITLES_MAP[alias]

  // Очищаем стейт при входе и уходе со страницы
  useEffect(() => {
    dispatch(resetRankExamState())
    return () => {
      dispatch(resetRankExamState())
    }
  }, [dispatch, alias])

  // Реактивная отправка аудиозаписи после остановки микрофона
  useEffect(() => {
    if (!audioBlob || audioBlob.size === 0) return

    dispatch(setRankExamAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchResponseRankExam({
        alias,
        audioBlob,
      }),
    ).then(() => {
      resetTranscript()
    })
  }, [audioBlob, alias, dispatch, resetTranscript])

  // Старт экзамена: бэкенд проверяет замок и выдает случайный билет
  const handleStartExam = () => {
    dispatch(fetchStartRankExam(alias))
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.RUNNING)
      })
      .catch((err) => {
        message.error(err || 'Экзамен пока недоступен')
      })
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setRankExamAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
  }

  const handleFinishExam = () => {
    dispatch(setRankExamAiStatus(AI_STATUS.AI_THINKING))

    dispatch(
      fetchFinishRankExam({
        alias,
        ticketId: ticketData?.id,
        userSpeech,
      }),
    )
      .unwrap()
      .then(() => {
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
      .catch((err) => {
        message.error(err || 'Ошибка при оценке экзамена')
        setScreenStatus(SCREEN_STATUS.FINISHED)
      })
  }

  const handleBackToProfile = () => {
    dispatch(resetRankExamState())
    navigate('/dashboard')
  }

  const handleRetakeExam = () => {
    dispatch(resetRankExamState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!headerInfo) {
    return (
      <div className={styles.main_exam}>
        <h2 className={styles.title}>Экзамен не найден</h2>
        <button
          className={styles.back_btn}
          onClick={handleBackToProfile}
        >
          Вернуться в профиль
        </button>
      </div>
    )
  }

  if (!user?.isPremium) {
    return <RankExamGate />
  }

  return (
    <div className={styles.main_exam}>
      <h2 className={styles.title}>{headerInfo.title}</h2>
      <p className={styles.descr}>{headerInfo.descr}</p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <RankExamIdle
            examTitle={headerInfo.title}
            timeLimit={headerInfo.defaultTime}
            isLoading={isLoading}
            error={error}
            onStartExam={handleStartExam}
            onBack={handleBackToProfile}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <RankExamProcess
            ticketData={ticketData}
            messages={messages}
            timeLimit={examMeta?.timeLimit || headerInfo.defaultTime}
            aiStatus={aiStatus}
            audioBlob={audioBlob}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishExam={handleFinishExam}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <RankExamResult
            onBackToProfile={handleBackToProfile}
            onRetakeExam={handleRetakeExam}
          />
        )}
      </div>
    </div>
  )
}

export default RankExamPage
