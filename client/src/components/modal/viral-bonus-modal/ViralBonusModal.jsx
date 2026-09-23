// components/modals/viral-bonus-modal/ViralBonusModal.jsx
import React, { useEffect, useMemo } from 'react'
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

import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
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
  const { isVkMobile } = useVkEnvironment()

  // Чтение карты квестов и состояния лоадеров напрямую из изолированного vkSlice
  const { isViralModalOpen, btnLoaders, viralBonusesClaimed } =
    useSelector((state) => state.vk)

  // 🛠️На десктопном ВК скрываем мобильные методы [INDEX]
  const visibleTasks = useMemo(() => {
    if (!isVkMobile) {
      return VIRAL_TASKS_CONFIG.filter(
        (task) =>
          task.type !== 'homeScreen' && task.type !== 'notifications',
      )
    }
    return VIRAL_TASKS_CONFIG
  }, [isVkMobile])

  // Проверяем наличие невыполненных заданий среди видимых
  const hasUnfinishedTasks = useMemo(() => {
    return visibleTasks.some(
      (task) => !viralBonusesClaimed[task.type],
    )
  }, [visibleTasks, viralBonusesClaimed])

  const handleClose = () => {
    dispatch(closeViralModal())
  }

  const handleOpenPremium = () => {
    dispatch(closeViralModal())
    dispatch(openPremiumModal())
  }

  const handleExecuteTask = async (type) => {
    let bridgeResult = false

    switch (type) {
      case 'favorites': {
        try {
          const res = await bridge.send('VKWebAppAddToFavorites')
          bridgeResult = Boolean(res?.result)
        } catch (error) {
          console.error('favorites error', error)
          bridgeResult = false
        }
        break
      }

      case 'homeScreen': {
        try {
          const res = await bridge.send('VKWebAppAddToHomeScreen')
          // Трактуем как успех, если не было явного отказа
          bridgeResult = !(res && res.result === false)
        } catch (error) {
          console.error('homeScreen error', error)
          bridgeResult = false
        }
        break
      }

      case 'notifications': {
        try {
          const res = await bridge.send('VKWebAppAllowNotifications')
          bridgeResult = Boolean(res?.enabled)
        } catch (error) {
          console.error('notifications error', error)
          bridgeResult = false
        }
        break
      }

      case 'communityJoin': {
        try {
          const res = await bridge.send('VKWebAppJoinGroup', {
            group_id: 241671966,
          })
          bridgeResult = Boolean(res?.result)
        } catch (error) {
          console.error('communityJoin error', error)
          bridgeResult = false
        }
        break
      }

      default:
        console.warn(`Неизвестный тип действия: ${type}`)
        bridgeResult = false
        break
    }

    if (bridgeResult) {
      console.log('Bridge success:', { type, bridgeResult })
      dispatch(
        fetchClaimVkBonus({
          taskType: type,
          launchParams: window.location.search,
        }),
      )
    }
  }

  useEffect(() => {
    if (isViralModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isViralModalOpen])

  useEffect(() => {
    if (!isViralModalOpen) return

    const handleEsc = (evt) => {
      if (evt.key === 'Escape') {
        dispatch(closeViralModal())
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isViralModalOpen, dispatch])

  if (!isViralModalOpen) return null

  return (
    <div className={styles.modal_overlay} onClick={handleClose}>
      <div
        className={styles.modal_container}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.btn_close_x} onClick={handleClose}>
          <FaTimes size={16} />
        </button>

        {hasUnfinishedTasks ? (
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

            <div className={styles.tasks_list_wrap}>
              {visibleTasks.map((task) => {
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
          <div className={styles.premium_fullscreen_block}>
            <div className={styles.premium_crown_zone}>
              <FaCrown size={40} className={styles.crown_gold} />
            </div>
            <h3 className={styles.premium_title}>
              Все бусты собраны! 🎉
            </h3>
            <p className={styles.premium_description}>
              Вы успешно выполнили все доступные задания сообщества
              Govorix ВКонтакте и получили максимум бесплатных наград.
              Чтобы продолжить тренировки без ограничений, переходите
              на тариф **Premium**.
            </p>

            <div className={styles.premium_features_mini}>
              <div className={styles.feature_bullet}>
                🚀 Полный безлимит энергии каждый день
              </div>
              <div className={styles.feature_bullet}>
                🤖 Доступ к тренажерам 3-го уровня
              </div>
              <div className={styles.feature_bullet}>
                ✨ Продвинутая ИИ-аналитика выполненых заданий
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
