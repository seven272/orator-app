import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { IoCompassOutline } from 'react-icons/io5'
import { MdOutlineLock } from 'react-icons/md' // Добавим замок для закрытого экрана

import {
  fetchCourseProgress,
} from '../../../redux/slices/courseSlice'
import TheoryBlock from '../blocks/theory-block/TheoryBlock'
import AiWorkoutBlock from '../blocks/ai-workout-block/AiWorkoutBlock'
import ExamBlock from '../blocks/exam-block/ExamBlock'
import IrlChallengeBlock from '../blocks/irl-challenge-block/IrlChallengeBlock'
import CourseWelcomeScreen from './course-welcome-screen/CourseWelcomeScreen'
import styles from './CourseTimeline.module.css'
import { COURSES_STATIC_CONTENT } from '../../../assets/data/courses/coursesContent'

const CourseTimeline = () => {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    status, // 'not_purchased' | 'purchased_not_started' | 'active'
    currentBlockIndex,
    progressData,
    courseStatus,
    error,
  } = useSelector((state) => state.course)

  const courseContent = COURSES_STATIC_CONTENT[courseCode]

  const STEP_TITLES = [
    courseContent?.theory?.title || 'Теория и база',
    courseContent?.ai_workout?.title || 'Тренажер с ИИ',
    courseContent?.irl_challenge?.title || 'Испытание реальностью',
    courseContent?.exam?.title || 'Финальный экзамен',
  ]

  useEffect(() => {
    if (courseCode) {
      dispatch(fetchCourseProgress(courseCode))
    }
  }, [dispatch, courseCode])

  const handleGoBack = () => {
    navigate(-1)
  }

  // Защита от некорректного URL
  if (!courseContent) {
    return (
      <div className={styles.empty_course_wrapper}>
        <div className={styles.empty_icon_container}>
          <IoCompassOutline
            size="100%"
            color="var(--color-primary)"
          />
        </div>
        <h1 className={styles.empty_title}>Курс не выбран</h1>
        <p className={styles.empty_description}>
          Похоже, вы не выбрали интенсив или указали неверный адрес.
          Вернитесь в Академию речи, чтобы начать прокачивать
          ораторское мастерство!
        </p>
        <button
          className={styles.primary_button}
          onClick={() => navigate('/courses')}
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

  // 🔥 СЦЕНАРИЙ 0: Жесткий блок, если курс на бэке имеет статус "not_purchased"
  if (status === 'not_purchased') {
    return (
      <div className={styles.empty_course_wrapper}>
        <div
          className={styles.empty_icon_container}
          style={{
            background:
              'linear-gradient(135deg, #fffff0, var(--color-light-gray))',
          }}
        >
          <MdOutlineLock size="50%" color="var(--color-text)" />
        </div>
        <h1 className={styles.empty_title}>Доступ ограничен</h1>
        <p className={styles.empty_description}>
          Этот интенсив еще не приобретен вами или был полностью
          завершен. Вернитесь в каталог Академии речи, чтобы открыть к
          нему пожизненный доступ!
        </p>
        <button
          className={styles.primary_button}
          onClick={() => navigate('/courses')}
        >
          Вернуться к каталогу курсов
        </button>
      </div>
    )
  }

  // Сценарий 1: Приветственный экран (Курс куплен, но не запущен)
  if (status === 'purchased_not_started') {
    return (
      <CourseWelcomeScreen
        courseCode={courseCode}
        courseContent={courseContent}
        onGoBack={handleGoBack}
      />
    )
  }

  // Сценарий 2: Активный курс в процессе прохождения
  return (
    <div className={styles.timeline_container}>
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
          <div className={styles.right_spacer} />
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
