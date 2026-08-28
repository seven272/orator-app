import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { All_EXERCISES } from '../../assets/mocks/exercises'
import styles from './ExercisePage.module.css'
import ExerciseRenderer from '../../components/exercise-renderer/ExerciseRenderer'


const ExercisePage = () => {
  const navigate = useNavigate() 
  const params = useParams()
  const [searchParams] = useSearchParams()
  const isDaily = searchParams.get('daily') === 'true'

  //  Находим иконку из статического конфига по alias
  const exerciseData = params?.alias
    ? Object.values(All_EXERCISES)
        .flat()
        .find(
          (ex) => ex.alias.toString() === params?.alias.toString(),
        )
    : null

  const handleGoBack = () => {
    navigate(-1)
  }

  if (!exerciseData) {
    return (
      <div className={styles.main_no_ex}>
        <button className={styles.back_btn} onClick={handleGoBack}>
          ← Назад в меню
        </button>
        <div className={styles.screen}>
          <span>Упражнение не найдено...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.main_exercise_page}>
      <div className={styles.wrapper}>
        <button className={styles.back_btn} onClick={handleGoBack}>
          ← Назад
        </button>
        <div className={styles.exercise_wrapper}>
          <ExerciseRenderer
            exercise={exerciseData}
            isDaily={isDaily}
          />
        </div>
      </div>
    </div>
  )
}

export default ExercisePage
