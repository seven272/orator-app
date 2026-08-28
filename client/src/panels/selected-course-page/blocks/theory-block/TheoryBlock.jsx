import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchSubmitTheoryQuiz,
  clearCourseError,
} from '../../../../redux/slices/courseSlice'

import styles from './TheoryBlock.module.css'
import { COURSES_STATIC_CONTENT } from '../../../../assets/data/courses/coursesContent'
import TheoryData from './theory-data/TheoryData'
import TheoryQuiz from './theory-quiz/TheoryQuiz'

const TheoryBlock = ({ courseCode }) => {
  const dispatch = useDispatch()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const courseTheory = COURSES_STATIC_CONTENT[courseCode]?.theory
  const slides = courseTheory?.slides || []
  const quiz = courseTheory?.quiz || null

  const isQuizStage = currentSlide === slides.length

  // Сброс ошибки при уходе со страницы (размонтировании всего блока теории)
  useEffect(() => {
    return () => {
      dispatch(clearCourseError())
    }
  }, [dispatch])

  const handleNext = () => {
    if (currentSlide < slides.length) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
      dispatch(clearCourseError())
    }
  }

  const handleSubmit = async (answerIndex) => {
    setIsSubmitting(true)
    try {
      await dispatch(
        fetchSubmitTheoryQuiz({
          courseCode,
          answerIndex,
        }),
      ).unwrap()
    } catch (err) {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.block_wrapper}>
      {!isQuizStage ? (
        /* СЦЕНАРИЙ 1: Чтение теории */
        <TheoryData
          currentSlide={currentSlide}
          theorySlides={slides}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      ) : (
        /* СЦЕНАРИЙ 2: Интерактивный Квиз */
        <TheoryQuiz
          quizData={quiz}
          isSubmitting={isSubmitting}
          onPrev={handlePrev}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

export default TheoryBlock
