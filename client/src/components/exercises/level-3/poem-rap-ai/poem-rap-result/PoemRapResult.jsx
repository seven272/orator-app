import { useState } from 'react'
import { FaVk } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'
import { message } from 'antd'

import { useVkEnvironment } from '../../../../../hooks/useVkEnvironment'
import { shareAiExerciseResultToStory } from '../../../../../utils/vk-utils/vkShareStory'
import styles from './PoemRapResult.module.css'

// Специализированный словарь локализации для музыкального рэп-жюри
const dictionary = {
  rhythm: 'Ритмика',
  articulation: 'Четкость слогов',
  drive: 'Драйв',
}

const PoemRapResult = ({ onCloseExercise, onRestartExercise }) => {
  // Вытаскиваем вердикт из Redux-состояния рэп-манифеста
  const { verdict } = useSelector((state) => state.poemRap)

  const isVkEnvironment = useVkEnvironment()
  const [isSharing, setIsSharing] = useState(false)

  const handleShareStory = async () => {
    if (isSharing) return
    setIsSharing(true)

    message.loading({
      content: 'Связываемся с VK Игры...',
      key: 'storyAiVk',
    })

    const result = await shareAiExerciseResultToStory(
      'ai-poem-rap',
      verdict,
    )

    if (result && result.success) {
      message.success({
        content: 'Результат опубликован в Истории!',
        key: 'storyAiVk',
        duration: 3,
      })
    } else {
      message.error({
        content: 'Не удалось опубликовать историю',
        key: 'storyAiVk',
        duration: 3,
      })
    }

    setIsSharing(false)
  }

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Трек записан</h3>

        {/* Общий балл в круге */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация оценок по флоу */}
        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span>
                {dictionary[name] || name}: {value}%
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Вердикт ИИ-продюсера */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Рецензия ИИ-продюсера:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Навигационные кнопки управления */}
        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Записать еще дубль
          </button>
          <button
            className={styles.btn_close}
            onClick={onCloseExercise}
          >
            Завершить упражнение
          </button>

          {isVkEnvironment && (
            <button
              className={styles.btn_share}
              onClick={handleShareStory}
              disabled={isSharing}
            >
              <FaVk size={18} /> Поделиться результатом
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PoemRapResult
