import { useNavigate } from 'react-router-dom'
import { PiRobot } from 'react-icons/pi' // Используем ваш react-icons вместо antd

import styles from './UpgradeExerciseBanner.module.css'
import UPGRADE_MAPPING from '../../constants/upgradeMapping'


/**
 * Переиспользуемый автономный компонент-баннер для конверсии в ИИ-тренажеры
 * @param {string} alias - Алиас текущего базового тренажера
 */
const UpgradeExerciseBanner = ({ alias }) => {
  const navigate = useNavigate()

  //  данные апгрейда из констант
  const upgradeInfo = UPGRADE_MAPPING[alias]

  // Если апгрейд для тренажера не предусмотрен, баннер скрывается
  if (!upgradeInfo) return null

  const handleUpgradeClick = () => {
    navigate(`/exercise/preview/${upgradeInfo.upgradeAlias}`)
  }

  return (
    <div className={styles.ai_upgrade_banner}>
      <div className={styles.ai_upgrade_sparkle}>
        ✨ Продвинутый уровень с ИИ
      </div>
      <p className={styles.ai_upgrade_text}>
        Отличный результат! Закрепите навык в продвинутом
        тренажере <strong>«{upgradeInfo.title}»</strong>.{' '}
        <strong>ИИ-тренер</strong> проверит вашу речь в реальном
        времени, выставит баллы по ключевым критериям и
        укажет на ошибки.
      </p>

      {/* Полностью кастомная кнопка без использования UI-библиотек */}
      <button
        type="button"
        className={styles.btn_ai_upgrade}
        onClick={handleUpgradeClick}
      >
        <PiRobot size={18} className={styles.btn_icon} />
        Попробовать с ИИ
      </button>
    </div>
  )
}

export default UpgradeExerciseBanner
