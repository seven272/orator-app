import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  resetAiChat,
  setAiChatStatus,
} from '../../../../redux/slices/courseSlice'

import AiWorkoutIntro from './ai-workout-intro/AiWorkoutIntro'
import AiWorkoutChat from './ai-workout-chat/AiWorkoutChat'
import AiWorkoutResult from './ai-workout-result/AiWorkoutResult'
import TheoryReviewMode from '../theory-review-mode/TheoryReviewMode'
import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import { COURSES_STATIC_CONTENT } from '../../../../assets/data/courses/coursesContent'
import { INVESTOR_PITCH_SCENARIOS } from '../../../../assets/data/courses/scenarios/investorPitchScenarios'
import { OBJECTION_HANDLER_SCENARIOS } from '../../../../assets/data/courses/scenarios/objectionHandlerScenarios'
import { ELEVATOR_SPEECH_SCENARIOS } from '../../../../assets/data/courses/scenarios/elevatorSpeechScenarios'
import { NETWORKING_SCENARIOS } from '../../../../assets/data/courses/scenarios/networkingScenarios'
import { VIP_CLIENT_SCENARIOS } from '../../../../assets/data/courses/scenarios/vipClientScenarios'
import { HR_SCREENER_SCENARIOS } from '../../../../assets/data/courses/scenarios/hrScreenerScenarios'
import { STRESS_INTERVIEW_SCENARIOS } from '../../../../assets/data/courses/scenarios/stressInterviewScenarios'
import { VIP_AFTERPARTY_SCENARIOS } from '../../../../assets/data/courses/scenarios/vipAfterpartyScenarios'
import { BAR_SMALL_TALK_SCENARIOS } from '../../../../assets/data/courses/scenarios/barSmallTalkScenarios'
import { TOXIC_RELATIVE_SCENARIOS } from '../../../../assets/data/courses/scenarios/toxicRelativeScenarios'
import { STREET_RUDENESS_SCENARIOS } from '../../../../assets/data/courses/scenarios/streetRudenessScenarios'
import { TROLL_HANDLER_SCENARIOS } from '../../../../assets/data/courses/scenarios/trollHandlerScenarios'
import { TIME_LIMIT_PITCH_SCENARIOS } from '../../../../assets/data/courses/scenarios/timeLimitPitchScenarios'
import { IMPROMPTU_TOAST_SCENARIOS } from '../../../../assets/data/courses/scenarios/impromptuToastScenarios'
import { WEDDING_CHALLENGE_SCENARIOS } from '../../../../assets/data/courses/scenarios/weddingChallengeScenarios'
import { HERO_JOURNEY_SCENARIOS } from '../../../../assets/data/courses/scenarios/heroJourneyScenarios'
import { FIASCO_TURN_SCENARIOS } from '../../../../assets/data/courses/scenarios/fiascoTurnScenarios'
import { EMPATHY_SPARK_SCENARIOS } from '../../../../assets/data/courses/scenarios/empathySparkScenarios'
import { ANTI_FLATTERY_SCENARIOS } from '../../../../assets/data/courses/scenarios/antiFlatteryScenarios'
import { TAXI_BLITZ_SCENARIOS } from '../../../../assets/data/courses/scenarios/taxiBlitzScenarios'
import { FAMILY_MINEFIELD_SCENARIOS } from '../../../../assets/data/courses/scenarios/familyMinefieldScenarios'
import { VINTAGE_SCOUT_SCENARIOS } from '../../../../assets/data/courses/scenarios/vintageScoutScenarios'
import { DEAF_PASSENGER_SCENARIOS } from '../../../../assets/data/courses/scenarios/deafPassengerScenarios'

import {
  WORKOUT_CONFIGS,
  ALL_WORKOUT_THUNKS,
} from '../../../../assets/data/courses/config/workoutConfigs'
import styles from './AiWorkoutBlock.module.css'

const SCENARIOS_MAP = {
  investor_pitch: INVESTOR_PITCH_SCENARIOS,
  objection_handler: OBJECTION_HANDLER_SCENARIOS,
  elevator_speech: ELEVATOR_SPEECH_SCENARIOS,
  networking_expert: NETWORKING_SCENARIOS,
  vip_client_close: VIP_CLIENT_SCENARIOS,
  hr_screener: HR_SCREENER_SCENARIOS,
  stress_interview: STRESS_INTERVIEW_SCENARIOS,
  bar_small_talk: BAR_SMALL_TALK_SCENARIOS,
  vip_afterparty: VIP_AFTERPARTY_SCENARIOS,
  toxic_relative: TOXIC_RELATIVE_SCENARIOS,
  street_rudeness: STREET_RUDENESS_SCENARIOS,
  troll_handler: TROLL_HANDLER_SCENARIOS,
  time_limit_pitch: TIME_LIMIT_PITCH_SCENARIOS,
  impromptu_toast: IMPROMPTU_TOAST_SCENARIOS,
  wedding_challenge: WEDDING_CHALLENGE_SCENARIOS,
  hero_journey: HERO_JOURNEY_SCENARIOS,
  fiasco_turn: FIASCO_TURN_SCENARIOS,
  empathy_spark: EMPATHY_SPARK_SCENARIOS,
  anti_flattery: ANTI_FLATTERY_SCENARIOS,
  family_minefield: FAMILY_MINEFIELD_SCENARIOS,
  taxi_blitz: TAXI_BLITZ_SCENARIOS,
  vintage_scout: VINTAGE_SCOUT_SCENARIOS,
  deaf_passenger: DEAF_PASSENGER_SCENARIOS,
}

const AiWorkoutBlock = ({ courseCode }) => {
  const dispatch = useDispatch()
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()
  const { error, progressData, aiChat } = useSelector(
    (state) => state.course,
  )
  const { aiStatus, chatStatus, verdict } = aiChat

  // Храним ID текущего активного тренажера
  const [selectedMode, setSelectedMode] = useState(null)
  const [isReviewingTheory, setIsReviewingTheory] = useState(false)

  //файлы теории
  const theorySlides =
    COURSES_STATIC_CONTENT[courseCode]?.theory?.slides || []
  // Достаем активный конфиг на основе стейта
  const currentConfig = WORKOUT_CONFIGS[selectedMode]
  // Читаем данные напрямую из вашего единого контент-файла
  const aiWorkoutStatic =
    COURSES_STATIC_CONTENT[courseCode]?.ai_workout
  // Вытаскиваем массив строк разрешенных тренажёров
  const allowedWorkoutIds = aiWorkoutStatic?.listTrainers || []
  // Порог очков теперь синхронизирован с бэкендом (1000 баллов)
  const REQUIRED_SCORE = 1000

  // 💡 ЛОКАЛЬНАЯ ФИЛЬТРАЦИЯ КАРТОЧЕК: Оставляем только нужные тренажёры
  const filteredWorkoutModes = Object.values(WORKOUT_CONFIGS).filter(
    (mode) => allowedWorkoutIds.includes(mode.id),
  )

  const accumulatedScore =
    progressData?.blocksProgress?.aiWorkout?.accumulatedScore || 0
  const sessionsCount =
    progressData?.blocksProgress?.aiWorkout?.sessionsCount || 0

  useEffect(() => {
    return () => {
      dispatch(resetAiChat())
    }
  }, [dispatch])

  const handleStartTrainer = (modeId) => {
    
    setSelectedMode(modeId) // Запоминаем режим

    const config = WORKOUT_CONFIGS[modeId]
  
    const targetScenarios = SCENARIOS_MAP[modeId]

    if (!config || !targetScenarios || targetScenarios.length === 0)
      return

    const randomIndex = Math.floor(
      Math.random() * targetScenarios.length,
    )
    const selectedScenario = targetScenarios[randomIndex]
   
    const payload = {
      role: selectedScenario.role,
      topic: selectedScenario.topic,
      context: selectedScenario.context,
      firstQuestion: selectedScenario.firstQuestion,
      scenarioId: selectedScenario.id,
    }

    // Динамический вызов Start Thunk
    const startThunk = ALL_WORKOUT_THUNKS[config.thunks.start]
    if (startThunk) {
      dispatch(startThunk({ courseCode, exerciseData: payload }))
    }
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setAiChatStatus('recording'))
    startListening()
  }

  const handleStopRecording = () => {
    if (chatStatus === 'loading' || aiStatus === 'ai_thinking') return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        dispatch(setAiChatStatus('active'))
        return
      }

      dispatch(setAiChatStatus('ai_thinking'))

      // Динамический вызов Send Thunk
      const sendThunk = ALL_WORKOUT_THUNKS[currentConfig.thunks.send]
      if (sendThunk) {
        dispatch(
          sendThunk({ courseCode, audioBlob: readyBlob }),
        ).then(() => {
          resetTranscript()
        })
      }
    })
  }

  const handleFinishTrainer = async () => {
    try {
      // Динамический вызов Finish Thunk
      const finishThunk =
        ALL_WORKOUT_THUNKS[currentConfig.thunks.finish]
      if (finishThunk) {
        await dispatch(finishThunk({ courseCode })).unwrap()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleBackToModes = () => {
    dispatch(resetAiChat())
    setSelectedMode(null)
  }

  if (isReviewingTheory) {
    return (
      <TheoryReviewMode
        slides={theorySlides}
        onBack={() => setIsReviewingTheory(false)}
      />
    )
  }

  if (aiStatus === 'finished') {
    return (
      <div className={styles.workout_container}>
        <AiWorkoutResult
          evaluationResult={verdict}
          config={currentConfig} // Передаем конфиг для динамических шкал
          onBack={handleBackToModes}
        />
      </div>
    )
  }

  if (aiStatus !== 'idle') {
    return (
      <div className={styles.workout_container}>
        <AiWorkoutChat
          aiChat={aiChat}
          chatStatus={chatStatus}
          config={currentConfig} // Передаем конфиг для динамических текстов
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onFinishTrainer={handleFinishTrainer}
          onExit={handleBackToModes}
        />
      </div>
    )
  }

  return (
    <div className={styles.workout_container}>
      <AiWorkoutIntro
        workoutModes={filteredWorkoutModes} // Массив генерируется из конфига автоматически
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        accumulatedScore={accumulatedScore}
        sessionsCount={sessionsCount}
        requiredScore={REQUIRED_SCORE}
        courseStatus={chatStatus}
        onStartTrainer={handleStartTrainer}
        onReviewTheory={() => setIsReviewingTheory(true)}
      />
      {(error || aiChat.error) && (
        <div className={styles.error_alert}>
          {error || aiChat.error}
        </div>
      )}
    </div>
  )
}

export default AiWorkoutBlock
