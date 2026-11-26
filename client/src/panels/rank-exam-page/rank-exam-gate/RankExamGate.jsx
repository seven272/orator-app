import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { openPremiumModal } from '../../../redux/slices/profileSlice'
import styles from './RankExamGate.module.css'

const RankExamGate = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

  return (
 <div className={styles.gate_wrapper}>
        <div className={styles.premium_gate_stub}>
          <div className={styles.crown_circle}>
            <span className={styles.crown_emoji}>👑</span>
          </div>

          <h3 className={styles.gate_title}>
            Экзамены доступны с подпиской Premium
          </h3>

          <p className={styles.gate_desc}>
            Подтвердите свой уровень перед ИИ-комиссией, получите персональный
            разбор речи и откройте следующий ранг оратора.
          </p>

          <div className={styles.gate_actions}>
            <button
              type="button"
              className={styles.premium_cta_btn}
              onClick={() => dispatch(openPremiumModal())}
            >
              Подключить Premium
            </button>

            <button
              type="button"
              className={styles.back_btn}
              onClick={() => navigate('/dashboard')}
            >
              Вернуться к карте пути
            </button>
          </div>
        </div>
      </div>
  )
}

export default RankExamGate