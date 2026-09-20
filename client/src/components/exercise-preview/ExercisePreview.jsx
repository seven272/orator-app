import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { BsBatteryCharging } from "react-icons/bs";
import { LuCrown } from 'react-icons/lu'
import { MdOutlineLock } from 'react-icons/md' // 🔥 Добавили MdBatteryAlert
import { FaQuestion } from 'react-icons/fa'
import { HiOutlineTicket } from 'react-icons/hi2'
import { checkIsAuth, checkIsVkGuest } from '../../redux/slices/authSlice' // Импортируем селекторы
import { openPremiumModal } from '../../redux/slices/profileSlice'
import styles from './ExercisePreview.module.css'

const ExercisePreview = ({ exData, onOpenTheory }) => {
  const navigate = useNavigate()
 const dispatch = useDispatch()
  const { user: profileUser } = useSelector((state) => state.profile)
  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)
  const isGuest = !isAuth || isVkGuest

  // 🎟️ Доступ по поштучным билетам (для 3 уровня)
  const targetTicketCode = `ticket_${exData.alias}`
  const userTicket = profileUser?.inventory?.find((inv) => inv.itemCode === targetTicketCode)
  const ticketQuantity = userTicket ? userTicket.quantity : 0
  const hasTicket = ticketQuantity > 0

  // 🔒 Блокировки (Уровень и жесткий Premium для 3 уровня)
  const currentLevel = Number(profileUser?.level) || 1
  const isLevelLocked = Number(exData.minLevel) > currentLevel
  // или вошел, но не имеет Premium и билетов — карточка гарантированно блокируется замком!
  const isPremiumLocked = exData.premium && (!isAuth || (!profileUser?.isPremium && !hasTicket))
  const isLocked = isLevelLocked || isPremiumLocked
  
  // ⚡ [НОВАЯ ФИЧА]: Определение истощения суточной энергии для 1 и 2 уровней
  // Если это обычный тренажер (не премиум-ИИ 3-го уровня), нет глобального Premium и бак энергии пуст
  let isEnergyExhausted = false
  if (!exData.premium && !profileUser?.isPremium) {
    const cost = exData.level === 2 ? 2 : 1 // Уровень 2 стоит 2⚡, Уровень 1 стоит 1⚡ [INDEX]
    const allowed = profileUser?.dailyEnergy?.allowed ?? (isAuth ? 15 : 3)
    const used = profileUser?.dailyEnergy?.used ?? 0
    const currentEnergy = isGuest 
      ? (parseInt(localStorage.getItem('govorix_guest_energy'), 10) || 3)
      : Math.max(0, allowed - used)

    isEnergyExhausted = currentEnergy < cost // Энергии меньше, чем нужно для старта раунда [INDEX]
  }
  // Бейдж билета: только если нет глобального премиума, но есть билеты
  const shouldShowTicketBadge = !profileUser?.isPremium && hasTicket

 

  // Клик по карточке
  const handleCardClick = () => {
   
    if (isLevelLocked) return

    if (isPremiumLocked) {
     dispatch(openPremiumModal())
      return
    }

    // Если это упражнение 1-2 уровня и кончилась энергия — мы ВСЕ РАВНО пускаем пользователя внутрь, 
    // чтобы он вовлекся, а наша модалка поймает его уже на кнопке «Начать» [INDEX]
    navigate(`/exercise/${exData.alias}`)
  }

  const openTheory = (evt) => {
    evt.stopPropagation()
    onOpenTheory?.(exData)
  }

  return (
    <div
      className={`${styles.execise_container} ${isLocked ? styles.locked : ''} ${isEnergyExhausted ? styles.energy_spent : ''}`}
      onClick={handleCardClick}
    >
      {/* ОВЕРЛЕЙ ЖЕСТКОГО ЗАМКА (Уровень или Премиум-ИИ 3 уровня) */}
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

      {/* ЛЕГКИЙ ОВЕРЛЕЙ ПУСТОЙ БАТАРЕЙКИ (Только для открытых, но истощенных упражнений) */}
     {!isLocked && isEnergyExhausted && (
  <div className={styles.energy_center_icon_wrap}>
    <BsBatteryCharging className={styles.battery_center_icon} />
  </div>
)}

      {/* БЕЙДЖ БИЛЕТА (для 3 уровня) */}
      {shouldShowTicketBadge && (
        <div className={styles.ticket_badge}>
          <HiOutlineTicket className={styles.ticket_badge_icon} />
          <span>Доступно по билету: {ticketQuantity} шт.</span>
        </div>
      )}

      {/* КОНТЕНТ УПРАЖНЕНИЯ */}
      <div className={`${styles.inner_content} ${isLocked ? styles.content_blur : ''} ${(!isLocked && isEnergyExhausted) ? styles.energy_blur : ''}`}>
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
