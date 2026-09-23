// components/modals/level-up-modal/LevelUpModal.jsx
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaCrown, FaVk } from 'react-icons/fa'
import { IoMdArrowRoundForward } from 'react-icons/io'
import { message } from 'antd'

import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import { closeLevelUpModal } from '../../../redux/slices/vkSlice'
import { shareLevelUpToStory } from '../../../utils/vk-utils/vkShareStory'
import styles from './LevelUpModal.module.css'

const LevelUpModal = () => {
  const dispatch = useDispatch()
  const { isVkEnvironment } = useVkEnvironment()
  const [isSharing, setIsSharing] = useState(false)

  const { isLevelUpModalOpen, levelUpData } = useSelector(
    (state) => state.vk,
  )

  const handleClose = () => {
    dispatch(closeLevelUpModal())
  }

  const handleShareStory = async () => {
    if (isSharing) return
    setIsSharing(true)

    message.loading({
      content: 'Связываемся с ВКонтакте...',
      key: 'storyLevelVk',
    })

    const result = await shareLevelUpToStory(levelUpData.newLevel)

    if (result && result.success) {
      message.success({
        content: 'Триумф опубликован в Истории!',
        key: 'storyLevelVk',
        duration: 3,
      })
      dispatch(closeLevelUpModal()) // Автоматически закрываем окно при успешном шеринге
    } else {
      message.error({
        content: 'Не удалось опубликовать историю',
        key: 'storyLevelVk',
        duration: 3,
      })
    }

    setIsSharing(false)
  }

  // Блокировка скролла подложки
  useEffect(() => {
    if (isLevelUpModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLevelUpModalOpen])

  // Закрытие окна ESC
  useEffect(() => {
    if (!isLevelUpModalOpen) return

    const handleEsc = (evt) => {
      if (evt.key === 'Escape') {
        dispatch(closeLevelUpModal())
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isLevelUpModalOpen, dispatch])

  if (!isLevelUpModalOpen) return null

  return (
    <div className={styles.modal_overlay} onClick={handleClose}>
      <div
        className={styles.modal_container}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.celebration_header}>
          <div className={styles.crown_animate_zone}>
            <FaCrown size={48} className={styles.crown_gold_icon} />
          </div>
          <h2 className={styles.modal_title}>Новый уровень!</h2>
          <p className={styles.modal_subtitle}>
            Поздравляем! Ваш ораторский скилл растет. Вы достигли{' '}
            <span className={styles.accent_level_num}>
              {levelUpData.newLevel}
            </span>{' '}
            уровня харизмы!
          </p>
        </div>

        {/* Награда / Мотивационный блок */}
        <div className={styles.level_perk_card}>
          <p className={styles.perk_text}>
            ✨ Ваш голос становится увереннее, а аргументы — сильнее.
            Продолжайте в том же духе!
          </p>
        </div>

        {/* Группа управляющих кнопок */}
        <div className={styles.btn_group_vertical}>
          {isVkEnvironment && (
            <button
              type="button"
              className={styles.btn_share_levelup}
              onClick={handleShareStory}
              disabled={isSharing}
            >
              <FaVk size={18} /> Поделиться успехом
            </button>
          )}

          <button
            type="button"
            className={styles.btn_continue_game}
            onClick={handleClose}
          >
            Продолжить тренировки <IoMdArrowRoundForward size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default LevelUpModal
