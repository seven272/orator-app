import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenSpinner } from '@vkontakte/vkui'
import { useDispatch, useSelector } from 'react-redux'
import styles from './KnockoutAi.module.css'

// Импортируем массив комедийных сценариев
import knockoutScenarios from '../../../../assets/data/scenarios/knockoutScenarios'
import { getRandomObjTask } from '../../../../utils/getRandomObjTask'

// Будущие дочерние компоненты стендапа
import KnockoutIdle from './knockout-idle/KnockoutIdle'
import KnockoutProcess from './knockout-process/KnockoutProcess'
import KnockoutResult from './knockout-result/KnockoutResult'

import { useSpeechSber } from '../../../../hooks/useSpeechSber'
import {
  SCREEN_STATUS,
  AI_STATUS,
} from '../../../../constants/exercises'

// Импортируем экшены из созданного ранее knockoutSlice
import {
  setKnockoutAiStatus,
  resetKnockoutState,
  fetchStartKnockout,
  fetchResponseKnockout,
  fetchFinishKnockout,
} from '../../../../redux/slices/ai-exercises/knockoutSlice'

import TheoryContent from '../../../theory-content/TheoryContent'
import Modal from '../../../../UI/modal/Modal'

const TOTAL_ROUNDS = 3
const TIME_ROUND = 20

const KnockoutAi = ({ alias, isDaily }) => {
  const { startListening, stopListening, resetTranscript } =
    useSpeechSber()
  const dispatch = useDispatch()
    const navigate = useNavigate()

  // --- UI СОСТОЯНИЕ ---
  const [randomSituation, setRandomSituation] = useState(null)
  const [poolSituation, setPoolSituation] = useState([])
  const [screenStatus, setScreenStatus] = useState(SCREEN_STATUS.IDLE)
  const [showModal, setShowModal] = useState(false)

  // --- REDUX СТEЙТ ---
  const exerciseState = useSelector((state) => state.knockout)
  const { messages, exStatus, aiStatus, audienceReputation } =
    exerciseState
  const isLoading = exStatus === 'loading'

  // Выбор случайного сценария при загрузке
  useEffect(() => {
    const { selectedItem, newPool } = getRandomObjTask(
      [],
      knockoutScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)

    return () => {
      dispatch(resetKnockoutState())
    }
  }, [dispatch])

  const handleStartExercise = () => {
    if (!randomSituation) return
    dispatch(fetchStartKnockout(randomSituation))
    setScreenStatus(SCREEN_STATUS.RUNNING)
  }

  const handleStartRecording = () => {
    resetTranscript()
    dispatch(setKnockoutAiStatus(AI_STATUS.RECORDING))
    startListening()
  }

  const handleStopRecording = () => {
    if (isLoading || aiStatus === AI_STATUS.AI_THINKING) return

    stopListening((readyBlob) => {
      if (!readyBlob || readyBlob.size === 0) {
        console.warn(
          'Микрофон выдал пустой буфер в тренажере стендапа',
        )
        return
      }
      dispatch(setKnockoutAiStatus(AI_STATUS.AI_THINKING))
      dispatch(fetchResponseKnockout({ audioBlob: readyBlob })).then(
        () => {
          resetTranscript()
        },
      )
    })
  }

  const handleFinishDialog = () => {
    setScreenStatus(SCREEN_STATUS.FINISHED)
    dispatch(fetchFinishKnockout({ isDaily }))
  }

  const handleRefreshTopic = () => {
    const { selectedItem, newPool } = getRandomObjTask(
      poolSituation,
      knockoutScenarios,
    )
    setRandomSituation(selectedItem)
    setPoolSituation(newPool)
    dispatch(resetKnockoutState())
  }

  const handleCloseExercise = () => {
    dispatch(resetKnockoutState())
    navigate('/exercises/level3')
  }

  const handleRestartExercise = () => {
    dispatch(resetKnockoutState())
    setScreenStatus(SCREEN_STATUS.IDLE)
  }

  if (!randomSituation) return <ScreenSpinner />

  return (
    <div className={styles.main_knockout}>
      <h2 className={styles.title}>Остроумный нокаут</h2>
      <p className={styles.descr}>
        Парируй подколы хеклера на сцене, используя юмор и самоиронию
      </p>

      <div className={styles.screen}>
        {screenStatus === SCREEN_STATUS.IDLE && (
          <KnockoutIdle
            onRefreshTopic={handleRefreshTopic}
            onShowTheory={() => setShowModal(true)}
            situationData={randomSituation}
            onStart={handleStartExercise}
          />
        )}

        {screenStatus === SCREEN_STATUS.RUNNING && (
          <KnockoutProcess
            numberRounds={TOTAL_ROUNDS}
            messages={messages}
            audienceReputation={audienceReputation}
            timeLimit={TIME_ROUND}
            aiStatus={aiStatus}
            onStopRecording={handleStopRecording}
            onStartRecording={handleStartRecording}
            onFinishDialog={handleFinishDialog}
            isAiThinking={isLoading}
          />
        )}

        {screenStatus === SCREEN_STATUS.FINISHED && (
          <KnockoutResult
            onCloseExercise={handleCloseExercise}
            onRestartExercise={handleRestartExercise}
          />
        )}
      </div>

      <Modal active={showModal} onClose={() => setShowModal(false)}>
        <TheoryContent
          alias={alias}
          onClose={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}

export default KnockoutAi
