import React from 'react'
import { useNavigate } from 'react-router-dom'
import { IoSchoolOutline, IoTrendingUpOutline } from 'react-icons/io5'
import styles from './CoursesBannerBlock.module.css'

const CoursesBannerBlock = () => {
   const navigate = useNavigate()

  // Замените '/courses' на реальный путь к вашей панели или экрану с курсами
  const handleNavigation = () => {
    navigate('/courses')
  }

  return (
    <section className={styles.courses_section}>
      <h2 className={styles.section_title}>🎓 АКАДЕМИЯ РЕЧИ</h2>

      <div className={styles.card} onClick={handleNavigation}>
        <div className={styles.content_wrap}>
     

         
          <div className={styles.icon_wrapper}>
            <IoSchoolOutline
              size="100%"
              color="var(--color-primary)"
            />
          </div>

          <div className={styles.content}>
            <span className={styles.course_title}>
              Развитие навыков риторики
            </span>
            <span className={styles.description}>
              Пошаговые программы для прокачки голоса, дикции, жестов
              и уверенности
            </span>
          </div>

             {/* Правая иконка вместо текста «8 КУРСОВ» */}
          <div className={styles.side_info}>
            <div className={styles.side_icon_wrapper}>
              <IoTrendingUpOutline 
                size="24px" 
                color="var(--color-primary)" 
              />
            </div>
          </div>
        </div>

        {/* Футер баннера в точном соответствии с вашим дизайном */}
        <div className={styles.banner_footer}>
          <span>Нажми, чтобы открыть каталог курсов</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default CoursesBannerBlock
