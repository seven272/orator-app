import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'
import { IoCompassOutline } from 'react-icons/io5'

import {
  fetchCourseProgress,
  fetchStartCourse,
} from '../../../redux/slices/courseSlice'
import TheoryBlock from '../blocks/theory-block/TheoryBlock'
import AiWorkoutBlock from '../blocks/ai-workout-block/AiWorkoutBlock'
import ExamBlock from '../blocks/exam-block/ExamBlock'
import IrlChallengeBlock from '../blocks/irl-challenge-block/IrlChallengeBlock'
import styles from './CourseTimeline.module.css'
import { COURSES_STATIC_CONTENT } from '../../../assets/data/courses/coursesContent'

const CourseTimeline = () => {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    status,
    currentBlockIndex,
    progressData,
    courseStatus,
    error,
  } = useSelector((state) => state.course)

  //  Достаем текстовый контент конкретного интенсива по его коду
  const courseContent = COURSES_STATIC_CONTENT[courseCode]

  // Массив заголовков для каждого шага
  const STEP_TITLES = [
    courseContent?.theory.title || 'Теория и база',
    courseContent?.ai_workout.title || 'Тренажер с ИИ',
    courseContent?.irl_challenge.title || 'Испытание реальностью',
    courseContent?.exam.title || 'Финальный экзамен',
  ]

  useEffect(() => {
    if (courseCode) {
      dispatch(fetchCourseProgress(courseCode))
    }
  }, [dispatch, courseCode])

  const handleGoBack = () => {
    navigate(-1)
  }

  // Защита на случай, если ввели несуществующий в конфиге courseCode
// Обновленная защита на случай, если курс не выбран или код неверный
if (!courseContent) {
  return (
    <div className={styles.empty_course_wrapper}>
      {/* Крупный визуальный якорь с иконкой компаса */}
      <div className={styles.empty_icon_container}>
        <IoCompassOutline 
          size="100%" 
          color="var(--color-primary)" 
        />
      </div>

      <h1 className={styles.empty_title}>Курс не выбран</h1>
      <p className={styles.empty_description}>
        Похоже, вы не выбрали интенсив или указали неверный адрес. 
        Вернитесь в Академию речи, чтобы начать прокачивать ораторское мастерство!
      </p>

      {/* Кнопка мгновенного возврата в каталог */}
      <button
        className={styles.primary_button}
        onClick={() => navigate('/courses')} // Перенаправляем на выбор курсов
      >
        Открыть каталог интенсивов
      </button>
    </div>
  )
}
  if (courseStatus === 'loading') {
    return (
      <div className={styles.loader_container}>
        Загрузка интенсива...
      </div>
    )
  }

  // Сценарий 1: Приветственный экран
 if (status === 'not_started') {
  return (
    <div className={styles.welcome_wrapper}>
      {/* Крупный визуальный якорь курса на цветной подложке */}
      <div className={styles.welcome_icon_container}>
        <img 
          src={courseContent.icon || '🎯'} 
          alt={courseContent.title} 
          className={styles.welcome_ai_image} 
        />
      </div>

      <h1 className={styles.course_title}>{courseContent.title}</h1>
      <p className={styles.course_description}>
        {courseContent.description}
      </p>
      
      <button
        className={styles.primary_button}
        onClick={() => dispatch(fetchStartCourse(courseCode))}
      >
        Начать обучение
      </button>
      <button
        className={styles.secondary_back_button}
        onClick={handleGoBack}
      >
        Назад к выбору курсов
      </button>
    </div>
  )
}
  // Сценарий 2: Активный курс
  return (
    <div className={styles.timeline_container}>
      {/* Улучшенная двухуровневая шапка */}
      <header className={styles.timeline_header}>
        <div className={styles.top_bar}>
          <button
            className={styles.inline_back_button}
            onClick={handleGoBack}
            aria-label="Назад"
          >
            ‹
          </button>
          <div className={styles.header_info}>
            <span className={styles.step_counter}>
              Шаг {currentBlockIndex + 1} из 4
            </span>
            <h2 className={styles.current_step_title}>
              {STEP_TITLES[currentBlockIndex] || 'Обучение'}
            </h2>
          </div>
          <div className={styles.right_spacer} />{' '}
          {/* Для идеальной центровки заголовка */}
        </div>

        <div className={styles.stepper_container}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`${styles.step_indicator} ${
                index === currentBlockIndex
                  ? styles.step_current
                  : index < currentBlockIndex
                    ? styles.step_completed
                    : ''
              }`}
            />
          ))}
        </div>
      </header>

      {error && <div className={styles.error_alert}>{error}</div>}

      <main className={styles.block_content_area}>
        {currentBlockIndex === 0 && (
          <TheoryBlock courseCode={courseCode} />
        )}
        {currentBlockIndex === 1 && (
          <AiWorkoutBlock
            courseCode={courseCode}
            data={progressData?.blocksProgress?.aiWorkout}
          />
        )}
        {currentBlockIndex === 2 && (
          <IrlChallengeBlock courseCode={courseCode} />
        )}
        {currentBlockIndex === 3 && (
          <ExamBlock
            courseCode={courseCode}
            data={progressData?.blocksProgress?.exam}
          />
        )}
      </main>
    </div>
  )
}

export default CourseTimeline
