import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { LuCrown } from 'react-icons/lu'
import { MdOutlineLock } from 'react-icons/md'
import { FaQuestion } from 'react-icons/fa'
import { HiOutlineTicket } from 'react-icons/hi2'

import styles from './ExercisePreview.module.css'

const ExercisePreview = ({ exData, onOpenPremium, onOpenTheory }) => {
  const navigate = useNavigate()

  const { user } = useSelector((state) => state.profile)

  // 🎟️ Доступ по поштучным билетам
  const targetTicketCode = `ticket_${exData.alias}`
  const userTicket = user?.inventory?.find((inv) => inv.itemCode === targetTicketCode)
  const ticketQuantity = userTicket ? userTicket.quantity : 0
  const hasTicket = ticketQuantity > 0

  // 🔒 Блокировки
  const currentLevel = Number(user?.level) || 1
  const isLevelLocked = Number(exData.minLevel) > currentLevel
  const isPremiumLocked = exData.premium && !user?.isPremium && !hasTicket
  const isLocked = isLevelLocked || isPremiumLocked

  // Бейдж билета: только если нет глобального премиума, но есть билеты
  const shouldShowTicketBadge = !user?.isPremium && hasTicket

  // Клик по карточке
  const handleCardClick = () => {
    if (isLevelLocked) return

    if (isPremiumLocked) {
      onOpenPremium?.()
      return
    }

    navigate(`/exercise/${exData.alias}`)
  }

  const openTheory = (e) => {
    e.stopPropagation()
    onOpenTheory?.(exData)
  }

  return (
    <div
      className={`${styles.execise_container} ${isLocked ? styles.locked : ''}`}
      onClick={handleCardClick}
    >
      {/* ОВЕРЛЕЙ ЗАМКА */}
      {isLocked && (
        <div className={`${styles.lock_overlay} ${isPremiumLocked ? styles.premium_lock : ''}`}>
          <div className={styles.lock_icon}>
            {isPremiumLocked ? <LuCrown size={40} /> : <MdOutlineLock size={40} />}
          </div>

          <span className={styles.lock_text}>
            {isPremiumLocked ? 'НУЖЕН PREMIUM' : `НУЖЕН ${exData.minLevel} УРОВЕНЬ`}
          </span>

          <button type="button" className={styles.theory_btn} onClick={openTheory}>
            <FaQuestion className={styles.theory_btn_icon} /> Об упражнении
          </button>
        </div>
      )}

      {/* БЕЙДЖ БИЛЕТА */}
      {shouldShowTicketBadge && (
        <div className={styles.ticket_badge}>
          <HiOutlineTicket className={styles.ticket_badge_icon} />
          <span>Доступно по билету: {ticketQuantity} шт.</span>
        </div>
      )}

      {/* КОНТЕНТ УПРАЖНЕНИЯ */}
      <div className={`${styles.inner_content} ${isLocked ? styles.content_blur : ''}`}>
        <div className={styles.execise_header}>
          <div className={styles.icon_wrap}>
            <img className={styles.icon} src={exData.icon} alt="иконка упражнения" />
          </div>
          <span className={styles.skill_tag}>{exData.skill}</span>
        </div>

        <div className={styles.execise_text_wrap}>
          <div className={styles.text_main}>
            <h3 className={styles.execise_title}>{exData.title}</h3>
            <p className={styles.execise_descr}>{exData.description}</p>
          </div>
          <div className={styles.execise_reward}>+{exData.reward} XP</div>
        </div>

        <div className={styles.exercise_footer}></div>
      </div>
    </div>
  )
}

export default ExercisePreview
