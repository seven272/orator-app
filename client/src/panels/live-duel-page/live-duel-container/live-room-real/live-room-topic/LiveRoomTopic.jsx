import React from 'react'
import styles from './LiveRoomTopic.module.css'

const LiveRoomTopic = ({ topic, mySide }) => {
  return (
    <div className={styles.topic_card}>
      <h3 className={styles.topic_label}>Тема дискуссии:</h3>
      <h2 className={styles.topic_title}>«{topic?.title || 'Без темы'}»</h2>
      <div className={styles.my_position_box}>
        Ваша позиция:{' '}
        <strong className={styles.side_highlight}>
          {mySide || 'Не определена'}
        </strong>
      </div>
    </div>
  )
}

export default LiveRoomTopic
