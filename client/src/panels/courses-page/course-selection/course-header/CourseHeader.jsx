import { useState, useEffect } from 'react'
import styles from './CourseHeader.module.css'

import CourseInfoModal from '../course-info-modal/CourseInfoModal'

// Справочник описаний этапов обучения для модального окна
const BLOCK_DESCRIPTIONS = [
  {
    button: ' 📖 Теория',
    title: '📖 Блок 1: Интерактивная теория',
    content:
      'Пошаговые слайды с ключевыми механиками, формулами общения и практическими примерами от экспертов. Никакой "воды" — только концентрированная выжимка знаний.',
  },
  {
    button: '📝 Тест',
    title: '📝 Блок 2: Закрепляющий тест',
    content:
      'Короткий квиз на проверку усвоенного материала. Помогает верифицировать знания теории перед тем, как вы перейдете к интерактивной практике.',
  },
  {
    button: '🤖 2 ИИ-тренажера',
    title: '🤖 Блок 3: Два ИИ-тренажера',
    content:
      'Уникальные симуляции реальных диалогов. Нейросеть имитирует поведение собеседников (клиентов, рекрутеров, инвесторов). Вы отвечаете голосом, а ИИ выдает детальный разбор по критериям.',
  },
  {
    button: '🎯 IRL-челлендж',
    title: '🎯 Блок 4: IRL-челлендж',
    content:
      'Задание "в поле" для закрепления материала на практике. Вы выполняете упражнение в реальной жизни и пишете текстовый отчет, который проходит жесткую ИИ-цензуру на подлинность.',
  },
  {
    button: '🎓 Экзамен',
    title: '🎓 Блок 5: Финальный экзамен',
    content:
      'Итоговая проверка навыков. Вы записываете связный голосовой монолог на 60–120 секунд. Робот-экзаменатор строго оценивает логику, подачу и структуру спича. Проходной балл — 85.',
  },
]

const CourseHeader = () => {
  const [openModal, setOpenModal] = useState(false)
  const [currentBlockInfo, setCurrentBlockInfo] = useState({
    title: '',
    content: '',
  })

  const handleOpenModal = ({ title, content }) => {
    console.log(title)
    setCurrentBlockInfo({ title, content })
    setOpenModal(true)
  }

  useEffect(() => {
    if (openModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [openModal])
  
  return (
    <div className={styles.info_header_block}>
      <h1 className={styles.main_title}>Выберите интенсив</h1>
      <p className={styles.main_description}>
        Пройдите пошаговое обучение с ИИ-тренажерами и прокачайте
        навыки до автоматизма
      </p>

      <div className={styles.structure_badge_container}>
        <div className={styles.structure_title}>
          За каждый пройденный интенсив вы получаете +1000 XP и 100
          монет
        </div>

        <div className={styles.badges_grid}>
          {BLOCK_DESCRIPTIONS.map((block, inx) => {
            return (
              <div
                key={inx}
                className={styles.badge_item_clickable}
                onClick={() =>
                  handleOpenModal({
                    title: block.title,
                    content: block.content,
                  })
                }
              >
                {block.button}
              </div>
            )
          })}
        </div>
      </div>
      {openModal && (
        <CourseInfoModal
          info={currentBlockInfo}
          closeModal={() => setOpenModal(false)}
        />
      )}
    </div>
  )
}

export default CourseHeader
