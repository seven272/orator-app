/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { fetchSubmitRealWorldTask } from '../../../../redux/slices/rankSlice'
import styles from './RankRequirementsDrawer.module.css'

const RankRequirementsDrawer = ({
  userXp,
  nextRank,
  requirements,
  canRankUp,
  rankUpLoading,
  onRankUp,
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { realTaskLoading } = useSelector((state) => state.rank)

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [aiReviewFeedback, setAiReviewFeedback] = useState('')

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (reportText.trim().length < 20) {
      message.warning(
        'Опишите выполнение задания подробнее (от 20 символов)',
      )
      return
    }

    try {
      const res = await dispatch(
        fetchSubmitRealWorldTask({
          targetRank: requirements.realWorldTask.targetRank,
          reportText: reportText.trim(),
        }),
      ).unwrap()

      setAiReviewFeedback(res.feedback)
      if (res.passed) {
        message.success('Задание в реальной жизни зачтено!')
        setIsTaskFormOpen(false)
      } else {
        message.info('ИИ-наставник просит дополнить отчет')
      }
    } catch (err) {
      message.error(err || 'Ошибка при отправке отчета')
    }
  }

  return (
    <div className={styles.drawer_panel}>
      <div className={styles.drawer_header}>
        <span className={styles.drawer_title}>
          Путь к рангу «{nextRank.title}» {nextRank.mic}
        </span>
        <span className={styles.drawer_hint}>
          {requirements.exam.isUnlocked
            ? 'База выполнена — финальные испытания открыты!'
            : 'Накопите XP и сдайте ИИ-тренажеры, чтобы открыть экзамен и практику'}
        </span>
      </div>

      <div className={styles.grid_2x2}>
        {/* 1. Опыт */}
        <div
          className={`${styles.req_card} ${requirements.xp.isDone ? styles.card_done : ''}`}
        >
          <div className={styles.card_top}>
            <span className={styles.card_badge}>1. Опыт оратора</span>
            <span className={styles.card_icon}>
              {requirements.xp.isDone ? '✅' : '⏳'}
            </span>
          </div>
          <div className={styles.xp_numbers}>
            <strong>{userXp.toLocaleString()}</strong> /{' '}
            {requirements.xp.required.toLocaleString()} XP
          </div>
          <div className={styles.mini_track}>
            <div
              className={styles.mini_fill}
              style={{ width: `${requirements.xp.percent}%` }}
            />
          </div>
        </div>

        {/* 2. ИИ-тренажеры */}
        <div
          className={`${styles.req_card} ${requirements.exercises.isDone ? styles.card_done : ''}`}
        >
          <div className={styles.card_top}>
            <span className={styles.card_badge}>2. ИИ-тренажеры</span>
            <span className={styles.card_icon}>
              {requirements.exercises.isDone ? '✅' : '🎯'}
            </span>
          </div>
          <div className={styles.ex_list}>
            {requirements.exercises.items.map((ex) => (
              <div key={ex.alias} className={styles.ex_row}>
                <span className={styles.ex_name}>
                  {ex.isDone ? '✓' : '•'} {ex.title} ({ex.bestScore}
                  /&gt;{ex.minScore})
                </span>
                {!ex.isDone && (
                  <button
                    type="button"
                    className={styles.inline_link}
                    onClick={() => navigate(`/exercise/${ex.alias}`)}
                  >
                    Пройти →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Экзамен */}
        <div
          className={`${styles.req_card} ${requirements.exam.isDone ? styles.card_done : ''} ${!requirements.exam.isUnlocked ? styles.card_locked : ''}`}
        >
          <div className={styles.card_top}>
            <span className={styles.card_badge}>
              3. {requirements.exam.title}
            </span>
            <span className={styles.card_icon}>
              {requirements.exam.isDone
                ? '✅'
                : requirements.exam.isUnlocked
                  ? '🔥'
                  : '🔒'}
            </span>
          </div>
          <p className={styles.card_desc}>
            {requirements.exam.isDone
              ? `Сдано! Лучший результат: ${requirements.exam.bestScore} баллов`
              : requirements.exam.isUnlocked
                ? `${requirements.exam.description} (Нужно >${requirements.exam.minScore} баллов)`
                : 'Заблокировано. Выполните условия 1 и 2, чтобы открыть экзамен.'}
          </p>
          {requirements.exam.isUnlocked &&
            !requirements.exam.isDone && (
              <button
                type="button"
                className={styles.card_primary_btn}
                onClick={() =>
                  navigate(`/rank-exam/${requirements.exam.alias}`)
                }
              >
                Сдать экзамен
              </button>
            )}
        </div>

        {/* 4. Задание в реальной жизни */}
        <div
          className={`${styles.req_card} ${requirements.realWorldTask.isDone ? styles.card_done : ''} ${!requirements.realWorldTask.isUnlocked ? styles.card_locked : ''}`}
        >
          <div className={styles.card_top}>
            <span className={styles.card_badge}>
              4. {requirements.realWorldTask.title}
            </span>
            <span className={styles.card_icon}>
              {requirements.realWorldTask.isDone
                ? '✅'
                : requirements.realWorldTask.isUnlocked
                  ? '🌍'
                  : '🔒'}
            </span>
          </div>
          <p className={styles.card_desc}>
            {requirements.realWorldTask.isUnlocked
              ? requirements.realWorldTask.description
              : 'Заблокировано. Выполните условия 1 и 2, чтобы открыть живое задание.'}
          </p>
          {requirements.realWorldTask.isUnlocked &&
            !requirements.realWorldTask.isDone && (
              <button
                type="button"
                className={styles.card_outline_btn}
                onClick={() => setIsTaskFormOpen((prev) => !prev)}
              >
                {isTaskFormOpen ? 'Отмена' : 'Написать отчет'}
              </button>
            )}
        </div>
      </div>

      {isTaskFormOpen &&
        requirements.realWorldTask.isUnlocked &&
        !requirements.realWorldTask.isDone && (
          <form
            className={styles.report_box}
            onSubmit={handleReportSubmit}
          >
            <textarea
              className={styles.report_textarea}
              rows={3}
              placeholder="Опишите, как вы выполнили задание в жизни и какой была реакция слушателей..."
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              disabled={realTaskLoading}
            />
            <div className={styles.report_footer}>
              <button
                type="submit"
                className={styles.card_primary_btn}
                disabled={realTaskLoading}
              >
                {realTaskLoading
                  ? 'ИИ проверяет отчет...'
                  : 'Отправить на проверку ИИ'}
              </button>
            </div>
          </form>
        )}

      {(aiReviewFeedback || requirements.realWorldTask.feedback) && (
        <div className={styles.ai_feedback_banner}>
          <strong>Вердикт ИИ-наставника:</strong>{' '}
          {aiReviewFeedback || requirements.realWorldTask.feedback}
        </div>
      )}

      {canRankUp && (
        <button
          type="button"
          className={styles.hero_rankup_btn}
          disabled={rankUpLoading}
          onClick={onRankUp}
        >
          {rankUpLoading
            ? 'Повышаем ранг...'
            : `🎉 Получить ранг «${nextRank.title}»`}
        </button>
      )}
    </div>
  )
}

export default RankRequirementsDrawer
