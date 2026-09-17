/* eslint-disable react/prop-types */
import React from 'react'
import { FaVk } from 'react-icons/fa6'
import { MdCheckCircle } from 'react-icons/md'
import styles from './VkConnectionRow.module.css'

const VkConnectionRow = ({ user, isLoading }) => {
  const handleLinkVkClick = () => {
    alert('Запуск процесса привязки ВКонтакте...')
  }

  return (
    <div className={styles.link_row}>
      <span className={styles.row_text_label}>
        <FaVk className={`${styles.row_icon} ${styles.vk_color_icon}`} />
        ВКонтакте
      </span>
      
      {user?.vkId ? (
        <span className={styles.status_connected_badge}>
          <MdCheckCircle /> Подключено
        </span>
      ) : (
        <button
          type="button"
          className={styles.vk_btn}
          onClick={handleLinkVkClick}
          disabled={isLoading}
        >
          Привязать VK
        </button>
      )}
    </div>
  )
}

export default VkConnectionRow
