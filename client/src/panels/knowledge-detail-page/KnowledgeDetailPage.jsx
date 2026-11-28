import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Spin, Result, Button, message } from 'antd'
import { TbArrowLeft, TbEye, TbShare } from 'react-icons/tb'

import {
  fetchGetKnowledgeBySlug,
  clearCurrentKnowledgeItem,
} from '../../redux/slices/educationHubSlice'
import { getSkillLabel } from '../../utils/skillsHelper'
import VideoEmbed from '../../components/video-embed/VideoEmbed'
import PracticeCtaCard from './practice-cta-card/PracticeCtaCard'

import styles from './KnowledgeDetailPage.module.css'

const KnowledgeDetailPage = () => {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentKnowledgeItem, isLoadingDetail, error } = useSelector(
    (state) => state.educationHub
  )

  useEffect(() => {
    if (slug) {
      dispatch(fetchGetKnowledgeBySlug(slug))
    }
    return () => {
      dispatch(clearCurrentKnowledgeItem())
    }
  }, [dispatch, slug])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    message.success('Ссылка на материал скопирована')
  }

  const handleStartExercise = (alias) => {
    navigate(`/exercise/${alias}`)
  }

  if (isLoadingDetail) {
    return (
      <div className={styles.center_box}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !currentKnowledgeItem) {
    return (
      <div className={styles.center_box}>
        <Result
          status="404"
          title="Материал не найден"
          subTitle={error || 'Возможно, статья была удалена или скрыта.'}
          extra={
            <Button type="primary" onClick={() => navigate('/hub/knowledge')}>
              Вернуться в Базу знаний
            </Button>
          }
        />
      </div>
    )
  }

  const {
    title,
    type,
    summary,
    contentMarkdown,
    coverImage,
    video,
    skillTag,
    relatedExerciseAlias,
    viewsCount,
  } = currentKnowledgeItem

  const isVideo = type === 'video'

  return (
    <div className={styles.detail_page}>
      {/* Верхняя панель действий */}
      <div className={styles.top_nav_row}>
        <button
          type="button"
          className={styles.back_btn}
          onClick={() => navigate('/hub/knowledge')}
        >
          <TbArrowLeft size={18} />
          <span>Назад к материалам</span>
        </button>

        <button
          type="button"
          className={styles.share_btn}
          onClick={handleShare}
          title="Скопировать ссылку на материал"
        >
          <TbShare size={17} />
          <span>Поделиться</span>
        </button>
      </div>

      {/* Основная карточка контента */}
      <article className={styles.article_card}>
        <div className={styles.meta_header}>
          {skillTag && (
            <span className={styles.skill_badge}>{getSkillLabel(skillTag)}</span>
          )}
          <span className={styles.views_badge}>
            <TbEye size={15} /> {viewsCount || 1}
          </span>
        </div>

        <h1 className={styles.article_title}>{title}</h1>

        {summary && <p className={styles.article_lead}>{summary}</p>}

        {/* Медиа-блок: Видеоплеер или Обложка */}
        {isVideo && video?.platform && video?.videoId ? (
          <div className={styles.media_block}>
            <VideoEmbed
              platform={video.platform}
              videoId={video.videoId}
              title={title}
              coverImage={coverImage}
            />
          </div>
        ) : (
          coverImage && (
            <div className={styles.media_block}>
              <img
                src={coverImage}
                alt={title}
                className={styles.article_cover}
              />
            </div>
          )
        )}

        {/* Текст статьи или конспект к видео в формате Markdown */}
        {contentMarkdown && (
          <div className={styles.markdown_body}>
            <ReactMarkdown>{contentMarkdown}</ReactMarkdown>
          </div>
        )}
      </article>

      {/* Карточка перехода в ИИ-тренажер */}
      <PracticeCtaCard
        exerciseAlias={relatedExerciseAlias}
        onStartExercise={handleStartExercise}
      />
    </div>
  )
}

export default KnowledgeDetailPage
