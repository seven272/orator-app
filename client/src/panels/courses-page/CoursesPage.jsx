import styles from './CoursesPage.module.css'
import CourseSelection from './course-selection/CourseSelection'

const CoursesPage = () => {
  return (
    <div className={styles.main_course_page}>
      <CourseSelection />
    </div>
  )
}

export default CoursesPage
