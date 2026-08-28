import React from 'react'
import { Progress } from 'antd'
import {
  StarOutlined,
  CrownOutlined,
  TeamOutlined,
  MessageOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import styles from './LiveDuelStats.module.css'

const LiveDuelStats = ({ duelStats }) => {
  if (!duelStats) return null

  // Преобразуем объект распределения оценок {1: X, 2: Y...} в отсортированный массив
  const distributionArray = Object.entries(duelStats.distribution)
    .map(([stars, count]) => ({ stars: Number(stars), count }))
    .sort((a, b) => b.stars - a.stars) // 5 звезд сверху

  // Вычисляем общее количество оценок для расчета процентов полосы
  const totalRatingsCount = Object.values(
    duelStats.distribution,
  ).reduce((a, b) => a + b, 0)

  return (
    /* Главный внешний контейнер, объединяющий всю статистику живых дуэлей */
    <div className={styles.card}>
      {/* Главный заголовок секции */}
      <h3 className={styles.card_title}>
        <TeamOutlined className={styles.icon_main} /> Живые дуэли
      </h3>

      {/* 1. Внутренняя мини-сетка карточек дуэлей */}
      <div className={styles.stats_grid}>
        {/* Подблок количества встреч */}
        <div className={styles.sub_card}>
          <div className={styles.stat_header}>
            <TeamOutlined className={styles.icon_duels_count} />
            <span className={styles.stat_title}>Всего дуэлей</span>
          </div>
          <div className={styles.stat_value}>
            {duelStats.totalRooms}
          </div>
          <div className={styles.stat_sub}>
            Фидбек: {duelStats.feedbackRate}% комнат
          </div>
        </div>

        {/* Подблок рейтинга */}
        <div className={styles.sub_card}>
          <div className={styles.stat_header}>
            <CrownOutlined className={styles.icon_rating} />
            <span className={styles.stat_title}>Средний балл</span>
          </div>
          <div className={styles.stat_value}>
            {duelStats.averageRating.toFixed(1)}{' '}
            <span className={styles.star_mini}>
              <StarOutlined />
            </span>
          </div>
          <div className={styles.stat_sub}>
            На основе оценок оппонентов
          </div>
        </div>
      </div>

      {/* 2. Гистограмма распределения (показываем, только если есть сыгранные комнаты) */}
      {duelStats.totalRooms > 0 && (
        <div className={styles.inner_section}>
          <h4 className={styles.sub_section_title}>
            <BarChartOutlined /> Распределение оценок
          </h4>
          <div className={styles.distribution_list}>
            {distributionArray.map(({ stars, count }) => {
              const percent =
                totalRatingsCount > 0
                  ? Math.round((count / totalRatingsCount) * 100)
                  : 0

              return (
                <div key={stars} className={styles.distribution_row}>
                  <div className={styles.dist_label}>
                    {stars}{' '}
                    <StarOutlined
                      style={{ color: '#fadb14', fontSize: '11px' }}
                    />
                  </div>
                  <div className={styles.dist_progress}>
                    <Progress
                      percent={percent}
                      showInfo={false}
                      strokeColor="#fadb14"
                      trailColor="#f5f5f5"
                      size={['100%', 8]}
                    />
                  </div>
                  <div className={styles.dist_count}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. История последних поединков */}
      <div className={styles.inner_section_last}>
        <h4 className={styles.sub_section_title}>
          <MessageOutlined /> Последняя дуэль
        </h4>
        <div className={styles.activity_list}>
          {duelStats.history.length === 0 ? (
            <div className={styles.empty_text}>
              Вы еще не участвовали в дуэлях
            </div>
          ) : (
            duelStats.history.map((item, index) => (
              <div key={index} className={styles.activity_item}>
                <div className={styles.activity_info}>
                  <div className={styles.activity_name}>
                    {item.topic || 'Без темы'}
                  </div>
                  <div className={styles.activity_score}>
                    {item.date
                      ? new Date(item.date).toLocaleDateString('ru-RU')
                      : ''}
                  </div>
                </div>
                <div className={styles.activity_count}>
                  {item.rating !== null ? (
                    <>
                      <StarOutlined style={{ color: '#fadb14' }} />{' '}
                      {item.rating}
                    </>
                  ) : (
                    <span className={styles.no_rating}>
                      Без оценки
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveDuelStats
