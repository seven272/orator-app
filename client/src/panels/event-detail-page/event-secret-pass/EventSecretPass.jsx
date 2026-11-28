import React from 'react'
import { message } from 'antd'
import { TbLockOpen, TbCopy } from 'react-icons/tb'

import styles from './EventSecretPass.module.css'

const EventSecretPass = ({ isOffline, secretLocationOrLink }) => {
  if (!secretLocationOrLink) {
    return null
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(secretLocationOrLink)
    message.success('Скопировано в буфер обмена')
  }

  const isUrl = secretLocationOrLink.startsWith('http')

  return (
    <div className={styles.secret_access_box}>
      <div className={styles.secret_header}>
        <TbLockOpen size={18} />
        <span>
          {isOffline ? 'Место проведения встречи' : 'Ссылка на подключение'}
        </span>
      </div>

      <div className={styles.secret_content_row}>
        {isUrl ? (
          <a
            href={secretLocationOrLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secret_link}
          >
            {secretLocationOrLink}
          </a>
        ) : (
          <span className={styles.secret_text}>{secretLocationOrLink}</span>
        )}

        <button
          type="button"
          className={styles.copy_btn}
          onClick={handleCopy}
          title="Скопировать"
        >
          <TbCopy size={16} />
        </button>
      </div>
    </div>
  )
}

export default EventSecretPass
