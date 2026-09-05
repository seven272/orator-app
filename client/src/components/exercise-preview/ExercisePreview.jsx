import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { LuCrown } from 'react-icons/lu'
import { MdOutlineLock } from 'react-icons/md'
import { FaQuestion } from 'react-icons/fa'

import styles from './ExercisePreview.module.css'
import Modal from '../../UI/modal/Modal'
import TheoryContent from '../theory-content/TheoryContent'
import PremiumModal from '../premium-modal/PremiumModal'

const ExercisePreview = ({ exData }) => {
  const navigate = useNavigate()
  
  // Берем данные напрямую из профиля
  const { user } = useSelector((state) => state.profile)
  
  const [showModalTheory, setShowModalTheory] = useState(false)
  const [showModalPremium, setShowModalPremium] = useState(false)

  // Расчет блокировок
  const isLevelLocked = Number(exData.minLevel) > Number(user?.level || 1)
  const isPremiumLocked = exData.premium && !user?.isPremium
  const isLocked = isLevelLocked || isPremiumLocked

  // Клик по карточке: если закрыто Премиумом — сразу открываем окно покупки
  const handleCardClick = () => {
    if (isPremiumLocked) {
      setShowModalPremium(true)
      return
    }
    if (!isLocked) {
      navigate(`/exercise/${exData.alias}`)
    }
  }

  const openTheory = (e) => {
    e.stopPropagation() // Предотвращаем всплытие клика к handleCardClick
    setShowModalTheory(true)
  }

  return (
    <>
      <div
        className={`${styles.execise_container} ${isLocked ? styles.locked : ''}`}
        onClick={handleCardClick}
      >
        {isLocked && (
          <div
            className={`${styles.lock_overlay} ${isPremiumLocked ? styles.premium_lock : ''}`}
          >
            <div className={styles.lock_icon}>
              {isPremiumLocked ? (
                <LuCrown size={40} />
              ) : (
                <MdOutlineLock size={40} />
              )}
            </div>
            
            <span className={styles.lock_text}>
              {isPremiumLocked
                ? 'PREMIUM ДОСТУП'
                : `НУЖЕН ${exData.minLevel} УРОВЕНЬ`}
            </span>
            
            <button
              type="button"
              className={styles.theory_btn}
              onClick={openTheory}
            >
              <FaQuestion size={15} /> Об упражнении
            </button>
          </div>
        )}

        {/* Контент упражнения */}
        <div
          className={`${styles.inner_content} ${isLocked ? styles.content_blur : ''}`}
        >
          <div className={styles.execise_header}>
            <div className={styles.icon_wrap}>
              <img
                className={styles.icon}
                src={exData.icon}
                alt="иконка упражнения"
              />
            </div>
            <span className={styles.skill_tag}>{exData.skill}</span>
          </div>

          <div className={styles.execise_text_wrap}>
            <div className={styles.text_main}>
              <h3 className={styles.execise_title}>{exData.title}</h3>
              <p className={styles.execise_descr}>
                {exData.description}
              </p>
            </div>
            <div className={styles.execise_reward}>
              +{exData.reward} XP
            </div>
          </div>

          <div className={styles.exercise_footer}></div>
        </div>
      </div>

      {/* Модалка теории */}
      <Modal
        active={showModalTheory}
        onClose={() => setShowModalTheory(false)}
      >
        <TheoryContent
          alias={exData.alias}
          onClose={() => setShowModalTheory(false)}
        />
      </Modal>

      {/* Модалка покупки Премиума (Исправлен баг бандла с методом onClose) */}
      <PremiumModal
        active={showModalPremium}
        onClose={() => setShowModalPremium(false)}
      />
    </>
  )
}

export default ExercisePreview
