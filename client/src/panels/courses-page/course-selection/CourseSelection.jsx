import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from 'antd' // Импортируем модальное окно из Ant Design

import styles from './CourseSelection.module.css'
import { ALL_COURSES_LIST } from '../../../assets/data/courses/coursesContent'

// 💡 Справочник описаний для модальных окон
const BLOCK_DESCRIPTIONS = {
  theory: {
    title: '📖 Блок 1: Интерактивная теория',
    content: 'Пошаговые слайды с ключевыми механиками, формулами общения и практическими примерами от экспертов. Никакой "воды" — только концентрированная выжимка знаний.',
  },
  quiz: {
    title: '📝 Блок 2: Закрепляющий тест',
    content: 'Короткий квиз на проверку усвоенного материала. Помогает верифицировать знания теории перед тем, как вы перейдете к интерактивной практике.',
  },
  workout: {
    title: '🤖 Блок 3: Два ИИ-тренажера',
    content: 'Уникальные симуляции реальных диалогов. Нейросеть имитирует поведение собеседников (клиентов, рекрутеров, инвесторов). Вы отвечаете голосом, а ИИ выдает детальный разбор по критериям.',
  },
  challenge: {
    title: '🎯 Блок 4: IRL-челлендж',
    content: 'Задание "в поле" для закрепления материала на практике. Вы выполняете упражнение в реальной жизни и пишете текстовый отчет, который проходит жесткую ИИ-цензуру на подлинность.',
  },
  exam: {
    title: '🎓 Блок 5: Финальный экзамен',
    content: 'Итоговая проверка навыков. Вы записываете связный голосовой монолог на 60–120 секунд. Робот-экзаменатор строго оценивает логику, подачу и структуру спича. Проходной балл — 85.',
  },
} 

const CourseSelection = () => {
  const navigate = useNavigate()
  
  // 💡 Состояние для управления модальным окном Antd
  const [modalData, setModalData] = useState({ visible: false, title: '', content: '' })

  const handleStartTraining = (courseCode) => {
    navigate(`/course/${courseCode}`)
  }

  // 💡 Функция для открытия модалки с нужным контентом
  const openBlockInfo = (blockKey) => {
    const info = BLOCK_DESCRIPTIONS[blockKey]
    if (info) {
      setModalData({
        visible: true,
        title: info.title,
        content: info.content,
      })
    }
  }

  const closeModal = () => {
    setModalData({ visible: false, title: '', content: '' })
  }

  return (
    <div className={styles.selection_container}>
      {/* 🎓 ИНФОРМАЦИОННАЯ ШАПКА КУРСОВ */}
      <div className={styles.info_header_block}>
        <h1 className={styles.main_title}>Выберите интенсив</h1>
        <p className={styles.main_description}>
          Пройдите пошаговое обучение с ИИ-тренажерами и прокачайте навыки до автоматизма
        </p>
        
        <div className={styles.structure_badge_container}>
          <div className={styles.structure_title}>За каждый пройденный интенсив вы получаете +1000 XP и 100 монет</div>
          
          {/* 💡 Элементы теперь кликабельны, добавлен вызов функции openBlockInfo */}
          <div className={styles.badges_grid}>
            <div className={styles.badge_item_clickable} onClick={() => openBlockInfo('theory')}>📖 Теория</div>
            <div className={styles.badge_item_clickable} onClick={() => openBlockInfo('quiz')}>📝 Тест</div>
            <div className={styles.badge_item_clickable} onClick={() => openBlockInfo('workout')}>🤖 2 ИИ-тренажера</div>
            <div className={styles.badge_item_clickable} onClick={() => openBlockInfo('challenge')}>🎯 IRL-челлендж</div>
            <div className={styles.badge_item_clickable} onClick={() => openBlockInfo('exam')}>🎓 Экзамен</div>
          </div>
        </div>
      </div>

      {/* 🎛️ КОМПАКТНАЯ ДВУХКОЛОНОЧНАЯ СЕТКА КУРСОВ */}
      <div className={styles.courses_grid_block}>
        {ALL_COURSES_LIST.map((course, index) => {
          const isLastOdd = ALL_COURSES_LIST.length % 2 !== 0 && index === ALL_COURSES_LIST.length - 1
          
          return (
            <div
              key={course.code}
              className={`${styles.course_card} ${isLastOdd ? styles.course_card_fullwidth : ''}`}
            >
              <div className={styles.card_header}>
                <span className={styles.course_tag}>{course.tag}</span>
                 <div className={styles.course_icon_container}>
                  <img 
                    src={course.icon} 
                    alt={`Иконка интенсива ${course.title}`} 
                    className={styles.course_png_image} 
                  />
                </div>
              
              </div>
              
              <h3 className={styles.course_title}>{course.title}</h3>
              <p className={styles.course_text}>{course.description}</p>
              
              <button
                className={styles.card_action_button}
                onClick={() => handleStartTraining(course.code)}
              >
                Начать обучение
              </button>
            </div>
          )
        })}
      </div>

      {/* 💡 КОМПОНЕНТ МОДАЛЬНОГО ОКНА ANTD */}
      <Modal
        title={<span style={{ font: 'var(--font-l)', fontWeight: 'bold' }}>{modalData.title}</span>}
        open={modalData.visible}
        onOk={closeModal}
        onCancel={closeModal}
        footer={null} // Убираем стандартные кнопки OK/Cancel для более чистого мобильного UI
        centered // Центрируем модалку на экране
        styles={{
          body: {
            font: 'var(--font-m-light)',
            color: 'var(--color-text-dark)',
            lineHeight: 'var(--font-line-m)',
            paddingTop: '12px'
          }
        }}
      >
        <p>{modalData.content}</p>
      </Modal>
    </div>
  )
}

export default CourseSelection
