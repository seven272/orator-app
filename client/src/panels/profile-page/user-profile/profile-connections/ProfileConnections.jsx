/* eslint-disable react/prop-types */
import React from 'react'
import { useSelector } from 'react-redux'
import { MdOutlineManageAccounts } from 'react-icons/md'

import EmailBindRow from './email-bind-row/EmailBindRow'
import VkConnectionRow from './vk-connection-row/VkConnectionRow'
import styles from './ProfileConnections.module.css'

const ProfileConnections = () => {
  const { user, isLoading } = useSelector((state) => state.auth)
  
  // Проверка среды запуска (VK Mini Apps / обычный сайт)
  const isInsideVkParams = window.location.search.includes('vk_user_id')

  return (
    <div className={styles.connections_block}>
      <h5 className={styles.sub_heading}>
        <MdOutlineManageAccounts className={styles.heading_icon} />
        Управление аккаунтами
      </h5>

      {/* КЕЙС 1: Пользователь из ВК, у него ЕЩЕ НЕТ почты */}
      {!user?.email && <EmailBindRow user={user} />}

      {/* КЕЙС 2: Пользователь из ВК, и у него УЖЕ ЕСТЬ почта (показываем статус внутри ВК) */}
      {user?.vkId && user?.email && isInsideVkParams && (
        <div className={styles.success_status_row}>
          <span className={styles.status_connected}>
            🔒 Доступы для сайта (email/пароль) созданы успешно ✅
          </span>
        </div>
      )}

      {/* КЕЙС 3: Блок связи с ВК (Отображается ТОЛЬКО при заходе со стационарного Сайта) */}
      {!isInsideVkParams && (
        <VkConnectionRow user={user} isLoading={isLoading} />
      )}
    </div>
  )
}

export default ProfileConnections
