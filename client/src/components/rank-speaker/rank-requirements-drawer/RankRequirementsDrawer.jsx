/* eslint-disable react/prop-types */
import React from 'react'
import XpRequirementCard from './xp-requirement-card/XpRequirementCard'
import ExercisesRequirementCard from './exercises-requirement-card/ExercisesRequirementCard'
import ExamRequirementCard from './exam-requirement-card/ExamRequirementCard'
import RealTaskRequirementCard from './real-task-requirement-card/RealTaskRequirementCard'
import styles from './RankRequirementsDrawer.module.css'

const RankRequirementsDrawer = ({
  userXp,
  currentStageConfig,
  nextStageConfig,
  requirements,
  canRankUp,
  rankUpLoading,
  onRankUp,
}) => {
  const uiReqs = currentStageConfig?.nextRankRequirements
  if (!uiReqs || !nextStageConfig || !requirements) return null

  return (
    <div className={styles.drawer_panel}>
      <div className={styles.drawer_header}>
        <div className={styles.drawer_title_row}>
          <img
            src={nextStageConfig.icon}
            alt={nextStageConfig.title}
            className={styles.drawer_rank_icon}
          />
          <span className={styles.drawer_title}>
            Путь к рангу «{nextStageConfig.title}»
          </span>
        </div>
        <span className={styles.drawer_hint}>
          {requirements.exam.isUnlocked
            ? 'База выполнена — финальные испытания открыты!'
            : 'Накопите XP и сдайте ИИ-тренажеры, чтобы открыть экзамен и практику'}
        </span>
      </div>

      <div className={styles.grid_2x2}>
        <XpRequirementCard userXp={userXp} xpReq={requirements.xp} />

        <ExercisesRequirementCard
          exercisesReq={requirements.exercises}
          uiExercises={uiReqs.exercises}
        />

        <ExamRequirementCard
          examReq={requirements.exam}
          uiExam={uiReqs.exam}
        />

        <RealTaskRequirementCard
          realTaskReq={requirements.realWorldTask}
          uiRealTask={uiReqs.realWorldTask}
        />
      </div>

      {canRankUp && (
        <button
          type="button"
          className={styles.hero_rankup_btn}
          disabled={rankUpLoading}
          onClick={onRankUp}
        >
          {rankUpLoading
            ? 'Повышаем ранг...'
            : `🎉 Получить ранг «${nextStageConfig.title}»`}
        </button>
      )}
    </div>
  )
}

export default RankRequirementsDrawer
