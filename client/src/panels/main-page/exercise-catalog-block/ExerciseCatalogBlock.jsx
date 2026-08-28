import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './ExerciseCatalogBlock.module.css'
// Сюда вы подключите ваши новые сгенерированные ИИ-картинки
import level1 from '../../../assets/images/other/level1.png'
import level2 from '../../../assets/images/other/level2.png'
import level3 from '../../../assets/images/other/level3.png'

const ExerciseCatalogBlock = () => {
  const navigate = useNavigate()

  return (
    <section className={styles.catalog_section}>
      <h2 className={styles.section_title}>⭐ КАТАЛОГ УПРАЖНЕНИЙ</h2>
      <div className={styles.catalog_grid}>
        
        {/* КАРТОЧКА: БАЗА */}
        <button
          className={`${styles.catalog_item} ${styles.type_base}`}
          onClick={() => navigate('exercises/level1')}
        >
          <div className={styles.image_container}>
            <img src={level1} alt="Базовый уровень" className={styles.ai_image} />
          </div>
          <div className={styles.text_container}>
            <span className={styles.level_title}>БАЗА</span>
            <span className={styles.level_subtitle}>1 Уровень</span>
          </div>
        </button>

        {/* КАРТОЧКА: ПРОДВИНУТЫЙ */}
        <button
          className={`${styles.catalog_item} ${styles.type_advanced}`}
          onClick={() => navigate('exercises/level2')}
        >
          <div className={styles.image_container}>
            <img src={level2} alt="Продвинутый уровень" className={styles.ai_image} />
          </div>
          <div className={styles.text_container}>
            <span className={styles.level_title}>ПРОДВИНУТЫЙ</span>
            <span className={styles.level_subtitle}>2 Уровень</span>
          </div>
        </button>

        {/* КАРТОЧКА: ЭКСПЕРТ */}
        <button
          className={`${styles.catalog_item} ${styles.type_expert}`}
          onClick={() => navigate('exercises/level3')}
        >
          <div className={styles.image_container}>
            <img src={level3} alt="Эксперт уровень" className={styles.ai_image} />
          </div>
          <div className={styles.text_container}>
            <span className={styles.level_title}>ЭКСПЕРТ</span>
            <span className={styles.level_subtitle}>3 Уровень</span>
          </div>
        </button>

      </div>
    </section>
  )
}

export default ExerciseCatalogBlock
