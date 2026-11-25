/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { fetchRankUp } from '../../../redux/slices/rankSlice'
import RankTimeline from './rank-timeline/RankTimeline'
import RankRequirementsDrawer from './rank-requirements-drawer/RankRequirementsDrawer'
import styles from './ProfileSpeakerRank.module.css'

const ProfileSpeakerRank = ({ userXp = 0, speakerProgress }) => {
  const dispatch = useDispatch()
  const { rankUpLoading } = useSelector((state) => state.rank)

  // Храним индекс выбранной ступени (null — всё свернуто)
  const [selectedStageIndex, setSelectedStageIndex] = useState(null)

  if (!speakerProgress) return null

  const {
    currentRank,
    nextRank,
    stagesTimeline,
    isMaxRank,
    canRankUp,
    completedCount,
    totalCount,
    requirements,
  } = speakerProgress

  const isNextDrawerOpen =
    !isMaxRank && nextRank && selectedStageIndex === nextRank.rankIndex

  const previewStage =
    selectedStageIndex !== null && !isNextDrawerOpen
      ? stagesTimeline.find((s) => s.rankIndex === selectedStageIndex)
      : null

  const handleSelectStage = (rankIndex) => {
    setSelectedStageIndex((prev) => (prev === rankIndex ? null : rankIndex))
  }

  const handleToggleNextGate = () => {
    if (!nextRank) return
    setSelectedStageIndex((prev) =>
      prev === nextRank.rankIndex ? null : nextRank.rankIndex,
    )
  }

  const handleRankUp = async () => {
    try {
      const res = await dispatch(fetchRankUp()).unwrap()
      message.success(res.message || 'Ранг успешно повышен!')
      setSelectedStageIndex(null)
    } catch (err) {
      message.error(err || 'Не удалось повысить ранг')
    }
  }

  return (
    <div className={styles.stage_pass_card}>
      {/* 1. ШАПКА «STAGE PASS» */}
      <div className={styles.pass_header}>
        <div
          className={`${styles.spotlight_medallion} ${styles[`tier_${currentRank.rankIndex}`] || ''}`}
        >
          <span className={styles.medallion_emoji}>{currentRank.mic}</span>
        </div>

        <div className={styles.pass_info}>
          <div className={styles.pass_meta_row}>
            <span className={styles.pass_tag}>• РАНГ ОРАТОРА •</span>
            <span className={styles.venue_badge}>
              📍 {currentRank.audience}
            </span>
          </div>
          <h4 className={styles.pass_title}>{currentRank.title}</h4>
          <p className={styles.pass_quote}>«{currentRank.desc}»</p>
        </div>

        {/* Правый блок: Кнопка апгрейда или кнопка с 4 точками прогресса */}
        {!isMaxRank && nextRank && (
          <div className={styles.pass_actions}>
            {canRankUp ? (
              <button
                type="button"
                className={styles.hero_rankup_btn}
                disabled={rankUpLoading}
                onClick={handleRankUp}
              >
                {rankUpLoading
                  ? 'Повышаем...'
                  : `🎉 Получить ранг «${nextRank.title}»`}
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.gate_trigger_btn} ${isNextDrawerOpen ? styles.gate_trigger_active : ''}`}
                onClick={handleToggleNextGate}
              >
                <div className={styles.dots_row} aria-hidden="true">
                  {[0, 1, 2, 3].map((dotIdx) => (
                    <span
                      key={dotIdx}
                      className={`${styles.progress_dot} ${dotIdx < completedCount ? styles.dot_filled : ''}`}
                    />
                  ))}
                </div>
                <span>Следующий этап</span>
                <span className={styles.chevron}>
                  {isNextDrawerOpen ? '▲' : '▼'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. СТУПЕНИ АМФИТЕАТРА */}
      <RankTimeline
        stagesTimeline={stagesTimeline}
        nextRank={nextRank}
        selectedStageIndex={selectedStageIndex}
        canRankUp={canRankUp}
        completedCount={completedCount}
        totalCount={totalCount}
        onSelectStage={handleSelectStage}
      />

      {/* 3А. ПАНЕЛЬ 4 УСЛОВИЙ (если открыт следующий целевой ранг) */}
      {isNextDrawerOpen && requirements && nextRank && (
        <RankRequirementsDrawer
          userXp={userXp}
          nextRank={nextRank}
          requirements={requirements}
          canRankUp={canRankUp}
          rankUpLoading={rankUpLoading}
          onRankUp={handleRankUp}
        />
      )}

      {/* 3Б. КАРТОЧКА ПРЕДПРОСМОТРА (если кликнули по пройденной или далекой ступени) */}
      {previewStage && (
        <div className={styles.preview_card}>
          <div className={styles.preview_left}>
            <span className={styles.preview_emoji}>{previewStage.mic}</span>
            <div className={styles.preview_texts}>
              <div className={styles.preview_top}>
                <strong className={styles.preview_title}>
                  {previewStage.title}
                </strong>
                <span
                  className={`${styles.preview_status} ${previewStage.isCurrent ? styles.status_current : previewStage.isReached ? styles.status_done : styles.status_future}`}
                >
                  {previewStage.isCurrent
                    ? 'Ваш текущий уровень'
                    : previewStage.isReached
                      ? 'Этап пройден ✓'
                      : `Порог: ${previewStage.minXp.toLocaleString()} XP`}
                </span>
              </div>
              <span className={styles.preview_venue}>
                📍 Площадка: {previewStage.audience}
              </span>
              <p className={styles.preview_desc}>{previewStage.desc}</p>
            </div>
          </div>

          <button
            type="button"
            className={styles.preview_close_btn}
            onClick={() => setSelectedStageIndex(null)}
            aria-label="Закрыть предпросмотр"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileSpeakerRank
