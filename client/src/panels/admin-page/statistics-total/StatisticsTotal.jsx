import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { FaChevronDown, FaChevronUp, FaBookOpen, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import styles from './StatisticsTotal.module.css'

const COURSE_NAMES = {
  pitch_master: 'Питч на миллион',
  self_pitch_pro: 'Личный бренд: самопрезентация на миллион',
  hr_storm: 'HR-штурм: искусство собеседований',
  party_charisma: 'Харизма нетворкинга: свой в любой компании',
  social_shield: 'Психологический щит: ответ на агрессию и манипуляции',
  media_speaker: 'Оратор в кадре: магия публичных выступлений',
  toast_master: 'Король застолья: искусство тостов и ярких речей',
  story_master: 'Магия истории: искусство увлекательного рассказа',
}

const SOURCE_ICONS = {
  site: '💻',
  vk: '🌐',
  android: '📱',
}

const RANK_ICONS = ['🌱', '🎙️', '🔥', '👑', '🏆']

const StatisticsTotal = () => {
  const { analytics, loading, error } = useSelector((state) => state.admin)
  const [showCoursesList, setShowCoursesList] = useState(false)

  if (loading) {
    return <div className={styles.centered_msg}>Загрузка аналитики...</div>
  }

  if (error) {
    return <div className={styles.error_msg}>{error}</div>
  }

  if (!analytics) return null

  const {
    summary,
    exercises_analytics,
    top_purchases,
    courses_analytics,
    users_breakdown,
  } = analytics

  const getCourseTitle = (code) => COURSE_NAMES[code] || code

  return (
    <div className={styles.admin_container}>
      {/* 1. ВЕРХНЕУРОВНЕВЫЕ ПРОДУКТОВЫЕ МЕТРИКИ */}
      <h3 className={styles.block_main_title}>📊 Общая статистика</h3>
      <div className={styles.stats_grid}>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Всего пользователей</div>
          <div className={styles.stat_value}>{summary.total_users}</div>
        </div>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Удерживают стрик</div>
          <div className={styles.stat_value}>{summary.active_streaks} чел.</div>
        </div>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Премиум-аккаунты</div>
          <div className={styles.stat_value}>{summary.premium_users_count} ⭐</div>
        </div>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Конверсия в Premium</div>
          <div className={styles.stat_value}>{summary.premium_percentage}%</div>
        </div>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Средний уровень</div>
          <div className={styles.stat_value}>Lvl {summary.avg_level}</div>
        </div>
        <div className={styles.stat_card}>
          <div className={styles.stat_label}>Монет в экономике</div>
          <div className={styles.stat_value}>{summary.total_coins_in_economy} 🪙</div>
        </div>
      </div>

      {/* 1.1 ИСТОЧНИКИ РЕГИСТРАЦИИ И PREMIUM ПО ПЛАТФОРМАМ */}
      {users_breakdown?.by_source && (
        <div className={styles.section_card}>
          <h2 className={styles.section_title}>
            🧭 Источники регистрации и Premium
          </h2>
          {users_breakdown.by_source.map((src) => {
            const share =
              summary.total_users > 0
                ? Math.round((src.total / summary.total_users) * 100)
                : 0
            return (
              <div key={src.source} className={styles.data_row}>
                <span className={styles.row_name}>
                  {SOURCE_ICONS[src.source] || '🔹'} {src.label}
                </span>
                <div className={styles.breakdown_metrics}>
                  <span className={styles.row_meta}>
                    Всего: <strong>{src.total}</strong> ({share}%)
                  </span>
                  <span className={styles.premium_pill}>
                    ⭐ Premium: <strong>{src.premium}</strong>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1.2 РАСПРЕДЕЛЕНИЕ ПО РАНГАМ ОРАТОРА */}
      {users_breakdown?.by_rank && (
        <div className={styles.section_card}>
          <h2 className={styles.section_title}>
            🎖️ Распределение по рангам оратора
          </h2>
          {users_breakdown.by_rank.map((item) => {
            const share =
              summary.total_users > 0
                ? Math.round((item.count / summary.total_users) * 100)
                : 0
            return (
              <div key={item.rank} className={styles.data_row}>
                <span className={styles.row_name}>
                  {RANK_ICONS[item.rank] || '🏅'} {item.title}
                </span>
                <span className={styles.row_meta}>
                  <strong>{item.count}</strong> чел. ({share}%)
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. БЛОК ГЛОБАЛЬНОЙ СВОДКИ ПО КУРСАМ */}
      {courses_analytics?.summary && (
        <div className={styles.courses_summary_card}>
          <h2 className={styles.section_title}>📈 Аналитика курсов (Все пользователи)</h2>
          
          <div className={styles.courses_summary_grid}>
            <div className={styles.summary_item}>
              <FaBookOpen className={styles.icon_purchased} size={16} />
              <div className={styles.summary_info}>
                <span className={styles.summary_value}>{courses_analytics.summary.total_purchased || 0}</span>
                <span className={styles.summary_label}>Всего начато</span>
              </div>
            </div>
            <div className={styles.summary_item}>
              <FaCheckCircle className={styles.icon_success} size={16} />
              <div className={styles.summary_info}>
                <span className={styles.summary_value}>{courses_analytics.summary.total_completed || 0}</span>
                <span className={styles.summary_label}>Успешно сдано</span>
              </div>
            </div>
            <div className={styles.summary_item}>
              <FaTimesCircle className={styles.icon_failed} size={16} />
              <div className={styles.summary_info}>
                <span className={styles.summary_value}>{courses_analytics.summary.total_failed || 0}</span>
                <span className={styles.summary_label}>Провалено</span>
              </div>
            </div>
          </div>

          <div onClick={() => setShowCoursesList(!showCoursesList)} className={styles.box_nav_list}>
            <span className={styles.text_nav_list}>
              {showCoursesList ? 'свернуть детализацию' : 'смотреть детали по курсам'}
            </span>
            {showCoursesList ? <FaChevronUp size={13} /> : <FaChevronDown size={13} />}
          </div>

          {showCoursesList && (
            <div className={styles.courses_detail_list}>
              {courses_analytics.items && courses_analytics.items.length > 0 ? (
                courses_analytics.items.map((course, idx) => (
                  <div key={course.courseCode || idx} className={styles.course_row_detail}>
                    <div className={styles.course_name_title}>
                      {getCourseTitle(course.courseCode)}
                    </div>
                    <div className={styles.course_metrics_wrap}>
                      <span className={styles.metric_badge_info}>
                        Начали: <strong>{course.purchased || 0}</strong>
                      </span>
                      <span className={styles.metric_badge_success}>
                        Успешно: <strong>{course.completed || 0}</strong>
                      </span>
                      <span className={styles.metric_badge_error}>
                        Провалы: <strong>{course.failed || 0}</strong>
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty_courses_msg}>Данные по отдельным курсам отсутствуют</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. АКТИВНОСТЬ ПОЛЬЗОВАТЕЛЕЙ В ТРЕНАЖЕРАХ */}
      <div className={styles.section_card}>
        <h2 className={styles.section_title}>Активность по дням (dailyProgress)</h2>
        {exercises_analytics.length === 0 ? (
          <div className={styles.row_meta}>Нет данных об упражнениях</div>
        ) : (
          exercises_analytics.map((item) => (
            <div key={item._id} className={styles.data_row}>
              <span className={styles.row_name}>{item._id}</span>
              <span className={styles.row_meta}>
                Сессий: <strong>{item.total_sessions || 0}</strong> | Ср. балл:{' '}
                <strong>{item.avg_score ? Math.round(item.avg_score) : 0}</strong>
              </span>
            </div>
          ))
        )}
      </div>

      {/* 4. ПОКУПКИ ВНУТРИИГРОВЫХ ПРЕДМЕТОВ */}
      <div className={styles.section_card}>
        <h2 className={styles.section_title}>Популярные покупки (из Inventory)</h2>
        {top_purchases.length === 0 ? (
          <div className={styles.row_meta}>Покупок пока не совершалось</div>
        ) : (
          top_purchases.map((purchase, index) => (
            <div key={index} className={styles.data_row}>
              <span className={styles.row_name}>
                Код товара: <strong>{purchase.item_name}</strong>
              </span>
              <span className={styles.row_meta}>
                Куплено: <strong>{purchase.purchase_count} шт.</strong>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StatisticsTotal
