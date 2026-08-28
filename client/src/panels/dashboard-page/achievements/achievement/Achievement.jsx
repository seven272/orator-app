import { useState } from 'react'

import styles from './Achievement.module.css'
import Modal from '../../../../UI/modal/Modal'

const Achievement = ({ userAchievements, achievement }) => {
  const [showModal, setShowModal] = useState(false)
  const isUnlocked = userAchievements.some(
    (ua) => ua.code === achievement.code,
  )
  return (
    <div onClick={() => setShowModal(true)}>
      <div
        className={`${styles.item} ${!isUnlocked ? styles.locked : ''}`}
      >
        <div className={styles.iconBox}>
          <img
            src={achievement.icon}
            alt={achievement.title}
            className={styles.icon}
          />
        </div>
        <span className={styles.label}>{achievement.title}</span>
      </div>
      <Modal active={showModal} onClose={() => setShowModal(false)}>
        {achievement.descr}
      </Modal>
    </div>
  )
}

export default Achievement
