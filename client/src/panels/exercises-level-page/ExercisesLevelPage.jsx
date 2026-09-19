import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Dropdown } from 'antd' // Импортируем Dropdown из antd для быстрого переключения сложностей
import { IoHomeOutline } from 'react-icons/io5'
import { MdKeyboardArrowRight, MdExpandMore } from 'react-icons/md'

import ExercisePreview from '../../components/exercise-preview/ExercisePreview'
import styles from './ExercisesLevelPage.module.css'
import { All_EXERCISES } from '../../assets/mocks/exercises'
import TheoryContent from '../../components/theory-content/TheoryContent'
import PremiumModal from '../../components/modal/premium-modal/PremiumModal'
import Modal from '../../UI/modal/Modal'

import aiLevel1 from '../../assets/images/other/level1.png'
import aiLevel2 from '../../assets/images/other/level2.png'
import aiLevel3 from '../../assets/images/other/level3.png'

const ExercisesLevelPage = () => {
  const { level } = useParams()
  const navigate = useNavigate()
  const exList = All_EXERCISES[level] || []
  const [showModalPremium, setShowModalPremium] = useState(false)
  const [showModalTheory, setShowModalTheory] = useState(false)
  const [activeExercise, setActiveExercise] = useState(null)

  const dictionary = {
    level1: {
      shortName: 'База (уровень 1)',
      title: 'Базовый уровень: Фундамент речи',
      descr:
        'Раскройте природный потенциал вашего голоса. Здесь вы проработаете опору дыхания, избавитесь от зажимов, победите страх публичных выступлений и научитесь звучать объемно и уверенно с первых секунд.',
      icon: aiLevel1,
      typeClass: 'header_base',
    },
    level2: {
      shortName: 'Продвинутый (уровень 2)',
      title: 'Продвинутый уровень: Сила убеждения',
      descr:
        'Переходите от правильного звучания к управлению вниманием. Освойте искусство удержания аудитории, изучите законы аргументации, динамику жестов и мимики. Сделайте свою речь по-настоящему магнетической.',
      icon: aiLevel2,
      typeClass: 'header_advanced',
    },
    level3: {
      shortName: 'Эксперт (уровень 3)',
      title: 'Экспертный уровень: Высшая риторика',
      descr:
        'Уровень для профессиональных спикеров и лидеров. Научитесь блестяще импровизировать в стрессовых ситуациях, виртуозно отражать каверзные вопросы, управлять эмоциями зала и побеждать в жестких дебатах.',
      icon: aiLevel3,
      typeClass: 'header_expert',
    },
  }
  const currentLevelData = dictionary[level]

  // 🛠️ Конфигурация элементов выпадающего списка быстрого переключения уровней для Ant Design
  const dropdownItems = [
    { key: 'level1', label: 'Уровень 1: База' },
    { key: 'level2', label: 'Уровень 2: Продвинутый' },
    { key: 'level3', label: 'Уровень 3: Эксперт' },
  ].filter((item) => item.key !== level) // Исключаем текущий уровень из списка выбора

  const handleDropdownClick = ({ key }) => {
    navigate(`/exercises/${key}`) // Мгновенный переход на выбранный уровень сложности
  }

  const handleOpenPremium = () => {
    setShowModalPremium(true)
  }

  const handleOpenTheory = (exData) => {
    setActiveExercise(exData)
    setShowModalTheory(true)
  }

  return (
    <div className={styles.level_section}>
      {/* 🧭 НАВИГАЦИОННОЕ МЕНЮ (ХЛЕБНЫЕ КРОШКИ) */}
      <nav className={styles.breadcrumbs}>
        <Link to="/" className={styles.crumb_link}>
          <IoHomeOutline className={styles.crumb_home_icon} />
        </Link>

        <MdKeyboardArrowRight className={styles.crumb_separator} />

        <Link to="/exercises-all" className={styles.crumb_link}>
          Тренажеры
        </Link>

        <MdKeyboardArrowRight className={styles.crumb_separator} />

        {/* Интерактивный выпадающий список для мгновенной смены текущего уровня сложности */}
        {currentLevelData && (
          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: handleDropdownClick,
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <span className={styles.crumb_current_dropdown}>
              {currentLevelData.shortName}
              <MdExpandMore className={styles.dropdown_arrow} />
            </span>
          </Dropdown>
        )}
      </nav>

      {currentLevelData ? (
        /* Крупная интерактивная шапка уровня */
        <div
          className={`${styles.level_header_card} ${styles[currentLevelData.typeClass]}`}
        >
          <div className={styles.header_content}>
            <h3 className={styles.title}>{currentLevelData.title}</h3>
            <p className={styles.descr}>{currentLevelData.descr}</p>
            <div className={styles.stats_badge}>
              ⚡ {exList.length} упражнений доступно
            </div>
          </div>

          {/* ИИ-Иконка, вылетающая из круглого контейнера */}
          <div className={styles.image_container}>
            <img
              src={currentLevelData.icon}
              alt={currentLevelData.title}
              className={styles.ai_image}
            />
          </div>
        </div>
      ) : (
        <div className={styles.error_msg}>
          Уровень не найден или еще находится в разработке.
        </div>
      )}

      {/* Список упражнений уровня */}
      <div className={styles.list}>
        {exList.map((ex) => (
          <ExercisePreview
            key={ex.alias}
            exData={ex}
            onOpenPremium={handleOpenPremium}
            onOpenTheory={handleOpenTheory}
          />
        ))}
      </div>

      <Modal
        active={showModalTheory}
        onClose={() => {
          setShowModalTheory(false)
          setActiveExercise(null)
        }}
      >
        {activeExercise && (
          <TheoryContent
            alias={activeExercise.alias}
            onClose={() => {
              setShowModalTheory(false)
              setActiveExercise(null)
            }}
          />
        )}
      </Modal>

      <PremiumModal
        active={showModalPremium}
        onClose={() => setShowModalPremium(false)}
      />
    </div>
  )
}

export default ExercisesLevelPage
