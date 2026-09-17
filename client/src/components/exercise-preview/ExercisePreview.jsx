import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { LuCrown } from 'react-icons/lu'
import { MdOutlineLock } from 'react-icons/md'
import { FaQuestion } from 'react-icons/fa'
import { HiOutlineTicket } from 'react-icons/hi2' // Аккуратная иконка билета

import styles from './ExercisePreview.module.css'
import Modal from '../../UI/modal/Modal'
import TheoryContent from '../theory-content/TheoryContent'
import PremiumModal from '../premium-modal/PremiumModal'

const ExercisePreview = ({ exData }) => {
  const navigate = useNavigate()
  
  // Извлекаем данные профиля пользователя
  const { user } = useSelector((state) => state.profile)
  
  const [showModalTheory, setShowModalTheory] = useState(false)
  const [showModalPremium, setShowModalPremium] = useState(false)

  // 🎟️ Вычисляем доступы по поштучным билетам магазина
  const targetTicketCode = `ticket_${exData.alias}`
  const userTicket = user?.inventory?.find((inv) => inv.itemCode === targetTicketCode)
  const ticketQuantity = userTicket ? userTicket.quantity : 0
  const hasTicket = ticketQuantity > 0

  // 🔓 Расчет блокировок (Карточка открыта, если куплен билет ИЛИ активен общий премиум)
  const isLevelLocked = Number(exData.minLevel) > Number(user?.level || 1)
  const isPremiumLocked = exData.premium && !user?.isPremium && !hasTicket
  const isLocked = isLevelLocked || isPremiumLocked

  // Отображаем бейдж билета только если у юзера нет глобального премиума, но есть билеты
  const shouldShowTicketBadge = !user?.isPremium && hasTicket

  // Клик по карточке
  const handleCardClick = () => {
    if (isLevelLocked) return // Уровень заблокирован — клик не работает
    
    if (isPremiumLocked) {
       if (isPremiumLocked) {
      setShowModalPremium(true) // Открывала старую модалку PremiumModal
      return
    }
    }
    
    // Если всё открыто (по премиуму или по билету) — запускаем тренажер
    if (!isLocked) {
      navigate(`/exercise/${exData.alias}`)
    }
  }

  const openTheory = (e) => {
    e.stopPropagation() // Предотвращаем всплытие клика к родителю
    setShowModalTheory(true)
  }

  return (
    <>
      <div
        className={`${styles.execise_container} ${isLocked ? styles.locked : ''}`}
        onClick={handleCardClick}
      >
        {/* ОВЕРЛЕЙ ЗАМКА (Отображается только если нет ни премиума, ни билета) */}
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
                ? 'НУЖЕН PREMIUM'
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

        {/* СУПЕР-БЕЙДЖ: Сигнализирует о доступности тренажера по поштучному билету */}
        {shouldShowTicketBadge && (
          <div className={styles.ticket_badge}>
            <HiOutlineTicket className={styles.ticket_badge_icon} />
            <span>Доступно по билету: {ticketQuantity} шт.</span>
          </div>
        )}

        {/* КОНТЕНТ УПРАЖНЕНИЯ */}
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

      {/* Старая модалка премиума сохранена на уровне импортов, но вызов заменен на умный редирект */}
      <PremiumModal
        active={showModalPremium}
        onClose={() => setShowModalPremium(false)}
      />
    </>
  )
}

export default ExercisePreview
