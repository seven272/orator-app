import React from 'react'
import { useParams } from 'react-router-dom'

import ExercisePreview from '../../components/exercise-preview/ExercisePreview'
import styles from './ExercisesLevelPage.module.css'
import { All_EXERCISES } from '../../assets/mocks/exercises'

// Импортируем ИИ-картинки, которые сгенерировали для каталога
import aiLevel1 from '../../assets/images/other/level1.png'
import aiLevel2 from '../../assets/images/other/level2.png'
import aiLevel3 from '../../assets/images/other/level3.png'

const ExercisesLevelPage = () => {
  const { level } = useParams()
  const exList = All_EXERCISES[level] || []

  const dictionary = {
    level1: {
      title: 'Базовый уровень: Фундамент речи',
      descr: 'Раскройте природный потенциал вашего голоса. Здесь вы проработаете опору дыхания, избавитесь от зажимов, победите страх публичных выступлений и научитесь звучать объемно и уверенно с первых секунд.',
      icon: aiLevel1,
      typeClass: 'header_base'
    },
    level2: {
      title: 'Продвинутый уровень: Сила убеждения',
      descr: 'Переходите от правильного звучания к управлению вниманием. Освойте искусство удержания аудитории, изучите законы аргументации, динамику жестов и мимики. Сделайте свою речь по-настоящему магнетической.',
      icon: aiLevel2,
      typeClass: 'header_advanced'
    },
    level3: {
      title: 'Экспертный уровень: Высшая риторика',
      descr: 'Уровень для профессиональных спикеров и лидеров. Научитесь блестяще импровизировать в стрессовых ситуациях, виртуозно отражать каверзные вопросы, управлять эмоциями зала и побеждать в жестких дебатах.',
      icon: aiLevel3,
      typeClass: 'header_expert'
    },
  }

  const currentLevelData = dictionary[level]

  return (

      
      <div className={styles.level_section}>
        
        {currentLevelData ? (
          /* Крупная интерактивная шапка уровня */
          <div className={`${styles.level_header_card} ${styles[currentLevelData.typeClass]}`}>
            <div className={styles.header_content}>
              <h3 className={styles.title}>{currentLevelData.title}</h3>
              <p className={styles.descr}>{currentLevelData.descr}</p>
              <div className={styles.stats_badge}>
                ⚡ {exList.length} упражнений доступно
              </div>
            </div>
            
            {/* ИИ-Иконка, вылетающая из круглого контейнера */}
            <div className={styles.image_container}>
              <img 
                src={currentLevelData.icon} 
                alt={currentLevelData.title} 
                className={styles.ai_image} 
              />
            </div>
          </div>
        ) : (
          <div className={styles.error_msg}>Уровень не найден или еще находится в разработке.</div>
        )}

        {/* Список упражнений уровня */}
        <div className={styles.list}>
          {exList.map((ex) => (
            <ExercisePreview key={ex.alias} exData={ex} />
          ))}
        </div>
      </div>
   
  )
}

export default ExercisesLevelPage
