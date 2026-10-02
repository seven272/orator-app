import { useDispatch } from 'react-redux'

import { fetchProfileData } from '../../redux/slices/profileSlice'
import styles from './CoursesPage.module.css'
import CourseSelection from './course-selection/CourseSelection'
import { useEffect } from 'react'

const CoursesPage = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchProfileData())
  }, [dispatch])
  return (
    <div className={styles.main_course_page}>
      <CourseSelection />
    </div>
  )
}

export default CoursesPage
