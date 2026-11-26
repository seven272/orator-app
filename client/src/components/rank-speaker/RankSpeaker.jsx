/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import { fetchRankUp } from '../../redux/slices/rankSlice'
import { RANKS } from '../../constants/ranks'
import RankStageHeader from './rank-stage-header/RankStageHeader'
import RankTimeline from './rank-timeline/RankTimeline'
import RankRequirementsDrawer from './rank-requirements-drawer/RankRequirementsDrawer'
import RankStagePreview from './rank-stage-preview/RankStagePreview'
import styles from './RankSpeaker.module.css'

const RankSpeaker = ({ userXp = 0, speakerProgress }) => {
  const dispatch = useDispatch()
  const { rankUpLoading } = useSelector((state) => state.rank)
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

  const currentRankIndex = currentRank?.rankIndex ?? 0
  const nextRankIndex = nextRank?.rankIndex ?? null

  const currentStageConfig =
    RANKS.find((r) => r.rankIndex === currentRankIndex) || RANKS[0]
  const nextStageConfig =
    nextRankIndex !== null
      ? RANKS.find((r) => r.rankIndex === nextRankIndex)
      : null

  const isNextDrawerOpen =
    !isMaxRank &&
    nextStageConfig &&
    selectedStageIndex === nextRankIndex

  const previewStage =
    selectedStageIndex !== null && !isNextDrawerOpen
      ? RANKS.find((s) => s.rankIndex === selectedStageIndex)
      : null

  const previewServerState = previewStage
    ? stagesTimeline.find(
        (s) => s.rankIndex === previewStage.rankIndex,
      )
    : null

  const handleSelectStage = (rankIndex) => {
    setSelectedStageIndex((prev) =>
      prev === rankIndex ? null : rankIndex,
    )
  }

  const handleToggleNextGate = () => {
    if (nextRankIndex === null) return
    setSelectedStageIndex((prev) =>
      prev === nextRankIndex ? null : nextRankIndex,
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
      <RankStageHeader
        currentRankIndex={currentRankIndex}
        currentStageConfig={currentStageConfig}
        nextStageConfig={nextStageConfig}
        isMaxRank={isMaxRank}
        canRankUp={canRankUp}
        rankUpLoading={rankUpLoading}
        isNextDrawerOpen={isNextDrawerOpen}
        completedCount={completedCount}
        totalCount={totalCount}
        onRankUp={handleRankUp}
        onToggleNextGate={handleToggleNextGate}
      />

      {/* 2. СТУПЕНИ АМФИТЕАТРА */}
      <RankTimeline
        stagesTimeline={stagesTimeline}
        nextRankIndex={nextRankIndex}
        selectedStageIndex={selectedStageIndex}
        canRankUp={canRankUp}
        completedCount={completedCount}
        totalCount={totalCount}
        onSelectStage={handleSelectStage}
      />

      {/* 3А. ПАНЕЛЬ 4 УСЛОВИЙ */}
      {isNextDrawerOpen && requirements && nextStageConfig && (
        <RankRequirementsDrawer
          userXp={userXp}
          currentStageConfig={currentStageConfig}
          nextStageConfig={nextStageConfig}
          requirements={requirements}
          canRankUp={canRankUp}
          rankUpLoading={rankUpLoading}
          onRankUp={handleRankUp}
        />
      )}

      {/* 3Б. КАРТОЧКА ПРЕДПРОСМОТРА СТУПЕНИ */}

      {previewStage && (
        <RankStagePreview
          stage={previewStage}
          serverState={previewServerState}
          onClose={() => setSelectedStageIndex(null)}
        />
      )}
    </div>
  )
}

export default RankSpeaker
