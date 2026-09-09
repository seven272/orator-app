import React from 'react'
import { useSelector } from 'react-redux'
import { ALL_COURSES_LIST } from '../../../assets/data/courses/coursesContent'

import CourseHeader from './course-header/CourseHeader'
import CourseCard from './course-card/CourseCard'
import styles from './CourseSelection.module.css'

const CourseSelection = () => {
  const activePurchasedCourses =
    useSelector(
      (state) => state.profile.user.activePurchasedCourses,
    ) || []
  const isAdmin = useSelector((state) => state.auth.isAdmin) || false


  return (
    <div className={styles.selection_container}>
      {/* Автономная шапка со своим стейтом модалки */}
      <CourseHeader />

      {/* Сетка полностью независимых карточек */}
      <div className={styles.courses_grid_block}>
        {ALL_COURSES_LIST.map((course, index) => {
          const isLastOdd =
            ALL_COURSES_LIST.length % 2 !== 0 &&
            index === ALL_COURSES_LIST.length - 1
          const isPurchased =
            isAdmin || activePurchasedCourses.includes(course.code)

          return (
            <CourseCard
              key={course.code}
              course={course}
              isLastOdd={isLastOdd}
              isPurchased={isPurchased} // Передаем только этот флаг владения
            />
          )
        })}
      </div>
    </div>
  )
}

export default CourseSelection
