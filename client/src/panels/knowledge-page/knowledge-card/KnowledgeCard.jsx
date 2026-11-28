import React from 'react'
import {
  TbArticle,
  TbBrandYoutube,
  TbEye,
  TbChevronRight,
  TbSparkles,
} from 'react-icons/tb'

import { getSkillLabel } from '../../../utils/skillsHelper'

import styles from './KnowledgeCard.module.css'

const KnowledgeCard = ({ item, onSelect }) => {
  const isVideo = item.type === 'video'

  const thumb =
    item.coverImage ||
    (isVideo && item.video?.platform === 'youtube' && item.video?.videoId
      ? `https://youtube.com{item.video.videoId}/mqdefault.jpg`
      : '')

  return (
    <article
      className={styles.material_card}
      onClick={() => onSelect(item.slug)}
    >
      {thumb && (
        <div className={styles.card_cover_wrap}>
          <img
            src={thumb}
            alt={item.title}
            className={styles.card_cover_img}
            loading="lazy"
          />
          <span
            className={`${styles.type_badge} ${
              isVideo ? styles.type_badge_video : styles.type_badge_article
            }`}
          >
            {isVideo ? (
              <>
                <TbBrandYoutube size={14} /> Видеоразбор
              </>
            ) : (
              <>
                <TbArticle size={14} /> Статья
              </>
            )}
          </span>
        </div>
      )}

      <div className={styles.card_body}>
        <div className={styles.card_meta_top}>
          {!thumb && (
            <span
              className={`${styles.inline_type_tag} ${
                isVideo ? styles.tag_video : styles.tag_article
              }`}
            >
              {isVideo ? 'Видеоразбор' : 'Статья'}
            </span>
          )}

          {item.skillTag && (
            <span className={styles.skill_tag}>
              {getSkillLabel(item.skillTag)}
            </span>
          )}

          <span className={styles.views_count}>
            <TbEye size={14} /> {item.viewsCount || 0}
          </span>
        </div>

        <h3 className={styles.card_title}>{item.title}</h3>

        {item.summary && <p className={styles.card_summary}>{item.summary}</p>}

        <div className={styles.card_footer}>
          {item.relatedExerciseAlias ? (
            <span className={styles.practice_hint}>
              <TbSparkles size={14} /> Есть тренажер для практики
            </span>
          ) : (
            <span className={styles.read_more_text}>Изучить</span>
          )}

          <TbChevronRight size={18} className={styles.arrow_icon} />
        </div>
      </div>
    </article>
  )
}

export default KnowledgeCard
