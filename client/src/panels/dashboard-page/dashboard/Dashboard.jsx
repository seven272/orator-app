import React from 'react'
import { Spin, Progress } from 'antd'
import {
  FireOutlined,
  DollarOutlined,
  TrophyOutlined,
  HistoryOutlined,
  StarOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { Radar } from '@ant-design/plots'

import Achievements from '../achievements/Achievements'
import LiveDuelStats from '../live-duel-stats/LiveDuelStats'
import CourseHistory from '../course-history/CourseHistory'
import styles from './Dashboard.module.css'

const Dashboard = ({
  user,
  skills,
  weakPoint,
  recentActivity,
  totalExercises,
  duelStats,
  archiveCourses,
}) => {
  if (!skills || !user || !duelStats) {
    return <Spin size="large" fullscreen />
  }

  return (
    <div className={styles.container}>
      {/* 1. СТАТИСТИКА (ВЕРХНЯЯ ПАНЕЛЬ) */}
      <div className={styles.stats_grid}>
        {/* Карточка уровня */}
        <div className={styles.card}>
          <div className={styles.stat_header}>
            <TrophyOutlined className={styles.icon_level} />
            <span className={styles.stat_title}>Уровень</span>
          </div>
          <div className={styles.stat_value}>{user.level}</div>
          <Progress
            percent={user.levelProgressPercent}
            size="small"
            status="active"
            strokeColor="#faad14"
          />
          <div className={styles.stat_sub}>
            {user.xp} / {user.nextThreshold} XP
          </div>
        </div>

        {/* Карточка жетонов */}
        <div className={styles.card}>
          <div className={styles.stat_header}>
            <DollarOutlined className={styles.icon_coins} />
            <span className={styles.stat_title}>Жетоны</span>
          </div>
          <div className={styles.stat_value}>{user.coins}</div>
          <div className={styles.stat_sub}>Валюта для курсов</div>
        </div>

        {/* Карточка опыта за все время */}
        <div className={styles.card}>
          <div className={styles.stat_header}>
            <BarChartOutlined className={styles.icon_xp} />
            <span className={styles.stat_title}>Общий опыт</span>
          </div>
          <div className={styles.stat_value}>
            {user.lifetimeXp || 0}
          </div>
          <div className={styles.stat_sub}>За всё время</div>
        </div>

        {/* Карточка дисциплины */}
        <div className={styles.card}>
          <div className={styles.stat_header}>
            <FireOutlined className={styles.icon_streak} />
            <span className={styles.stat_title}>Стрик</span>
          </div>
          <div className={styles.stat_value}>
            {user.streak} <span className={styles.unit}>дн.</span>
          </div>
          <div className={styles.stat_sub}>
            Всего тренировок: {totalExercises || 0}
          </div>
        </div>
      </div>

      {/* 2. ЦЕНТРАЛЬНЫЙ БЛОК */}
      <div className={styles.main_grid}>
        {/* График */}
        <div className={`${styles.card} ${styles.radar_area}`}>
          <h3 className={styles.card_title}>Анализ навыков</h3>
          <div className={styles.chart_wrapper}>
            <Radar
              data={skills}
              xField="subject"
              yField="A"
              area={{ style: { fillOpacity: 0.4 } }}
              meta={{ A: { min: 0, max: 100 } }}
              smooth={true}
            />
          </div>
        </div>

        {/* 3. ЗОНА РОСТА */}
        {weakPoint && (
          <div className={styles.growth_banner}>
            <div className={styles.growth_icon}>
              <StarOutlined />
            </div>
            <div className={styles.growth_info}>
              <div className={styles.growth_title}>
                Твоя ближайшая цель: {weakPoint.skill}
              </div>
              <div className={styles.growth_desc}>
                Средний балл здесь {weakPoint.score}%.{' '}
                {weakPoint.recommendation}
              </div>
            </div>
          </div>
        )}

        {/* История */}
        <div className={`${styles.card} ${styles.activity_area}`}>
          <h3 className={styles.card_title}>
            <HistoryOutlined /> Последняя активность
          </h3>
          <div className={styles.activity_list}>
            {recentActivity?.map((item, index) => (
              <div key={index} className={styles.activity_item}>
                <div className={styles.activity_info}>
                  <div className={styles.activity_name}>
                    {item.title}
                  </div>
                  <div className={styles.activity_score}>
                    Очков: {item.totalPoints}
                  </div>
                </div>
                <div className={styles.activity_count}>
                  <StarOutlined style={{ color: '#fadb14' }} />{' '}
                  {item.completionsCount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* статистика пройденных курсов  */}
        <CourseHistory historyList={archiveCourses} />

        {/* статистика дуэлей  */}
        <LiveDuelStats duelStats={duelStats} />

        <Achievements />
      </div>
    </div>
  )
}

export default Dashboard
