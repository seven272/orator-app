import React from 'react'
import { useDispatch } from 'react-redux'
import { fetchStartCourse } from '../../../../redux/slices/courseSlice'
import styles from './CourseWelcomeScreen.module.css'

const CourseWelcomeScreen = ({ courseCode, courseContent, onGoBack }) => {
  const dispatch = useDispatch()

  return (
    <div className={styles.welcome_wrapper}>
      
      {/* Верхняя круглая 3D-иконка курса */}
      <div className={styles.welcome_icon_container}>
        <img 
          src={courseContent.icon || '🎯'} 
          alt={courseContent.title} 
          className={styles.welcome_ai_image} 
        />
      </div>

      <h1 className={styles.course_title}>{courseContent.title}</h1>
      <p className={styles.course_description}>{courseContent.description}</p>
      
      {/* Карта пути интенсива */}
      <div className={styles.welcome_roadmap}>
        <h3 className={styles.roadmap_title}>Программа интенсива:</h3>
        <div className={styles.roadmap_steps}>
          <div className={styles.roadmap_step}>
            <span className={styles.step_num}>1</span>
            <div>
              <strong>Интерактивная теория и тест</strong>
              <p>Базовые механики, формулы общения и экспресс-проверка знаний.</p>
            </div>
          </div>
          <div className={styles.roadmap_step}>
            <span className={styles.step_num}>2</span>
            <div>
              <strong>Тренажеры с ИИ</strong>
              <p>Голосовая отработка реальных диалогов с нейросетью.</p>
            </div>
          </div>
          <div className={styles.roadmap_step}>
            <span className={styles.step_num}>3</span>
            <div>
              <strong>Практика IRL «в поле»</strong>
              <p>Реальное жизненное задание и жесткая ИИ-цензура вашего отчета.</p>
            </div>
          </div>
          <div className={styles.roadmap_step}>
            <span className={styles.step_num}>4</span>
            <div>
              <strong>Финальный устный экзамен</strong>
              <p>60-120 сек монолога. Робот-экзаменатор ставит оценку (надо 85+).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Визуальный блок награды */}
      <div className={styles.welcome_reward_banner}>
        <span className={styles.reward_gift_icon}>🎁</span>
        <div className={styles.reward_banner_text}>
          <span>Награда за успешное окончание:</span>
          <strong>+1000 XP и 100 монет спикера</strong>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className={styles.welcome_actions_layout}>
        <button 
          className={styles.primary_button} 
          onClick={() => dispatch(fetchStartCourse(courseCode))}
        >
          Начать обучение
        </button>
        <button 
          className={styles.secondary_back_button} 
          onClick={onGoBack}
        >
          Назад к выбору курсов
        </button>
      </div>

    </div>
  )
}

export default CourseWelcomeScreen
