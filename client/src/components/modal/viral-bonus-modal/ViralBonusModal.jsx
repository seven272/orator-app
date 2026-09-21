// components/modals/ViralBonusModal.jsx
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import bridge from '@vkontakte/vk-bridge'
import {
  FaStar,
  FaMobileAlt,
  FaBell,
  FaUsers,
  FaTimes,
  FaCrown,
} from 'react-icons/fa'
import { IoMdCheckmarkCircle } from 'react-icons/io'

import {
  closeViralModal,
  fetchClaimVkBonus,
} from '../../../redux/slices/vkSlice'
import { openPremiumModal } from '../../../redux/slices/profileSlice'
import styles from './ViralBonusModal.module.css'

const VIRAL_TASKS_CONFIG = [
  {
    type: 'favorites',
    title: 'Закрепить в Избранном',
    icon: <FaStar className={styles.icon_favorites} />,
  },
  {
    type: 'homeScreen',
    title: 'Вынести на экран телефона',
    icon: <FaMobileAlt className={styles.icon_home} />,
  },
  {
    type: 'notifications',
    title: 'Включить пуш-уведомления',
    icon: <FaBell className={styles.icon_notify} />,
  },
  {
    type: 'communityJoin',
    title: 'Вступить в группу Govorix',
    icon: <FaUsers className={styles.icon_group} />,
  },
]

const ViralBonusModal = () => {
  const dispatch = useDispatch()

  const { isViralModalOpen, btnLoaders, viralBonusesClaimed } =
    useSelector((state) => state.vk)


  if (!isViralModalOpen) return null

  const handleClose = () => {
    dispatch(closeViralModal())
  }

  // Перенаправление на покупку Premium
  const handleOpenPremium = () => {
    dispatch(closeViralModal()) // Закрываем текущую виральную модалку
    dispatch(openPremiumModal()) // Открываем системный экран оплаты/премиума
  }

  const handleExecuteTask = async (type) => {
    try {
      let bridgeResult = false

      switch (type) {
        case 'favorites': {
          const res = await bridge.send('VKWebAppAddToFavorites')
          bridgeResult = res.result
          break
        }
        case 'homeScreen': {
          const res = await bridge.send('VKWebAppAddToHomeScreen')
          bridgeResult = res.result
          break
        }
        case 'notifications': {
          const res = await bridge.send('VKWebAppAllowNotifications')
          bridgeResult = res.result
          break
        }
        case 'communityJoin': {
          const res = await bridge.send('VKWebAppJoinGroup', {
            group_id: 54762318,
          })
          bridgeResult = res.result
          break
        }
        default:
          break
      }

      if (bridgeResult) {
        dispatch(fetchClaimVkBonus({ taskType: type }))
      }
    } catch (error) {
      console.warn(
        `Действие отклонено в VK Bridge для таска: ${type}`,
        error,
      )
    }
  }

  // Вычисляем, есть ли еще доступные задания для бесплатной энергии
  const hasUnfinishedTasks = Object.values(
    viralBonusesClaimed,
  ).includes(false)

  return (
    <div className={styles.modal_overlay} onClick={handleClose}>
      <div
        className={styles.modal_container}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Крестик закрытия */}
        <button className={styles.btn_close_x} onClick={handleClose}>
          <FaTimes size={16} />
        </button>

        {hasUnfinishedTasks ? (
          /* КЕЙС А: Есть доступные бесплатные задания */
          <>
            <div className={styles.modal_header}>
              <h3 className={styles.modal_title}>
                🏆 Ораторские бусты
              </h3>
              <p className={styles.modal_subtitle}>
                Выполняй задания от сообщества и забирай тройное комбо
                наград за каждое!
              </p>

              <div className={styles.reward_badge_combo}>
                <div className={styles.reward_item}>
                  <span>+5 ⚡</span> Энергия
                </div>
                <div className={styles.reward_item}>
                  <span>+100 🏆</span> Опыт
                </div>
                <div className={styles.reward_item}>
                  <span>+10 🪙</span> Жетоны
                </div>
              </div>
            </div>

            {/* Список оставшихся тасков */}
            <div className={styles.tasks_list_wrap}>
              {VIRAL_TASKS_CONFIG.map((task) => {
                const isClaimed =
                  viralBonusesClaimed[task.type] ?? false
                const isLoading = btnLoaders[task.type] ?? false

                return (
                  <div
                    key={task.type}
                    className={`${styles.task_item_row} ${isClaimed ? styles.task_item_claimed : ''}`}
                  >
                    <div className={styles.task_left_block}>
                      <div className={styles.task_icon_wrapper}>
                        {task.icon}
                      </div>
                      <span className={styles.task_name_text}>
                        {task.title}
                      </span>
                    </div>

                    <div className={styles.task_right_block}>
                      {isClaimed ? (
                        <span className={styles.badge_completed}>
                          <IoMdCheckmarkCircle size={18} /> Готово
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.btn_task_action}
                          onClick={() => handleExecuteTask(task.type)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className={styles.spinner_mini} />
                          ) : (
                            'Забрать'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Элегантный разделитель и подвал с предложением Premium */}
            <div className={styles.modal_footer_premium}>
              <div className={styles.divider} />
              <p className={styles.footer_text}>
                Нужен абсолютный безлимит без выполнения квестов?
              </p>
              <button
                type="button"
                className={styles.btn_buy_premium_vk}
                onClick={handleOpenPremium}
              >
                <FaCrown size={14} /> Перейти на Premium
              </button>
            </div>
          </>
        ) : (
          /* КЕЙС Б: Все бесплатные бусты израсходованы -> Полноценный сочный Premium оффер */
          <div className={styles.premium_fullscreen_block}>
            <div className={styles.premium_crown_zone}>
              <FaCrown size={40} className={styles.crown_gold} />
            </div>
            <h3 className={styles.premium_title}>
              Все бусты собраны! 🎉
            </h3>
            <p className={styles.premium_description}>
              Вы успешно выполнили все задания сообщества Govorix
              ВКонтакте и получили максимум бесплатных наград. Чтобы
              продолжить тренировки без ограничений, переходите на
              тариф **Premium**.
            </p>

            <div className={styles.premium_features_mini}>
              <div className={styles.feature_bullet}>
                🚀 Полный безлимит энергии каждый день
              </div>
              <div className={styles.feature_bullet}>
                🤖 Доступ к ИИ-тренажерам 3-го уровня (GigaChat-2)
              </div>
              <div className={styles.feature_bullet}>
                ✨ Уникальный золотой ободок профиля в рейтингах
              </div>
            </div>

            <button
              type="button"
              className={styles.btn_premium_primary}
              onClick={handleOpenPremium}
            >
              Подключить Premium-доступ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViralBonusModal
