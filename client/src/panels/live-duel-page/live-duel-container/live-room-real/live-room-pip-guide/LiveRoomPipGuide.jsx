import React from 'react'
import { FiPhoneCall, FiCornerRightDown } from 'react-icons/fi'
import styles from './LiveRoomPipGuide.module.css'

const LiveRoomPipGuide = ({ currentRound, isSpeakerA, onOpenVkCall }) => {
  return (
    <div className={styles.action_block}>
      {/* Индикатор ходов */}
      <div className={styles.turn_indicator}>
        {currentRound === 'speakerA' && (
          <p className={isSpeakerA ? styles.your_turn : styles.opponent_turn}>
            {isSpeakerA 
              ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.' 
              : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
          </p>
        )}
        {currentRound === 'speakerB' && (
          <p className={!isSpeakerA ? styles.your_turn : styles.opponent_turn}>
            {!isSpeakerA 
              ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.' 
              : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
          </p>
        )}
        {currentRound === 'blitz' && (
          <p className={styles.blitz_turn}>
            🔥 Свободная дискуссия! Задавайте вопросы и отвечайте взаимно.
          </p>
        )}
      </div>

      {/* Кнопка звонка */}
      <button onClick={onOpenVkCall} className={styles.vk_call_btn}>
        <FiPhoneCall size={18} />
        <span>Открыть VK Звонок</span>
      </button>

      {/* Интерактивная инструкция сворачивания */}
      <div className={styles.pip_instruction_card}>
        <div className={styles.pip_header}>
          <div className={styles.pip_pulse_dot}></div>
          <h4>Как одновременно видеть таймер?</h4>
        </div>
        <p className={styles.pip_text}>
          После старта звонка нажмите кнопку <strong>«Свернуть»</strong> внутри интерфейса VK. 
          Видео перейдет в плавающее окно, а перед вами откроется таймер текущего раунда дебатов.
        </p>
        <div className={styles.pip_animation_container}>
          <div className={styles.mock_phone}>
            <div className={styles.mock_video_overlay}>🎙️ Видеозвонок</div>
            <div className={styles.mock_arrow_stream}>
              <FiCornerRightDown className={styles.animated_arrow} />
            </div>
            <div className={styles.mock_pip_window}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveRoomPipGuide
