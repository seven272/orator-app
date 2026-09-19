import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FaCrown } from 'react-icons/fa' // Импорт красивой короны из react-icons
import { closePremiumOffer } from '../../../redux/slices/exerciseSlice'
import styles from './EnergyLimitAlert.module.css'

const EnergyLimitAlert = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const isPremiumOfferOpen = useSelector((state) => state.exercise.isPremiumOfferOpen)

  if (!isPremiumOfferOpen) {
    return null
  }

  const handleGoToShop = () => {
    dispatch(closePremiumOffer())
    navigate('/shop')
  }

  const handleGoToBack = () => {
    dispatch(closePremiumOffer())
    navigate('/')
  }

  return (
    <div className={styles.modal_overlay} onClick={() => dispatch(closePremiumOffer())}>
      <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
        
        {/* 🌟 Новое премиальное кольцо свечения вокруг короны */}
        <div className={styles.icon_glow_ring}>
          <FaCrown className={styles.crown_icon} />
        </div>

        <h2 className={styles.modal_title}>Лимит энергии исчерпан</h2>

        <p className={styles.modal_description}>
          Ваш суточный лимит бесплатной энергии (<span className={styles.highlight_blue}>15 единиц</span>) на сегодня полностью израсходован. Но завтра он снова восстановится.
        </p>
        
        <p className={styles.modal_description}>
          Оформите подписку <span className={styles.highlight_blue}>Premium</span>, чтобы  отключить любые ограничения, открыть мгновенный доступ к продвинутым ИИ-тренажерам 3-го уровня и тренироваться без пауз!
        </p>

        {/* Стек кнопок-капсул */}
        <div className={styles.actions_stack}>
          <button 
            type="button" 
            className={`${styles.base_btn} ${styles.shop_action_btn}`}
            onClick={handleGoToShop}
          >
            Снять ограничения
          </button>
          
          <button 
            type="button" 
            className={`${styles.base_btn} ${styles.cancel_text_btn}`}
            onClick={handleGoToBack}
          >
            Вернуться завтра
          </button>
        </div>

      </div>
    </div>
  )
}

export default EnergyLimitAlert
