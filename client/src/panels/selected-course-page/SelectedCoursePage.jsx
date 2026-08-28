import styles from './SelectedCoursePage.module.css'
import CourseTimeline from './course-timeline/CourseTimeline'

const SelectedCoursePage = () => {
  return (
    <div className={styles.main_course_page}>
      <CourseTimeline />
    </div>
  )
}

export default SelectedCoursePage
