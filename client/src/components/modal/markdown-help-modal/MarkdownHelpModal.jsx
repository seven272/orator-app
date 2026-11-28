import React, { useEffect } from 'react'
import { TbX } from 'react-icons/tb'

import styles from './MarkdownHelpModal.module.css'

const MARKDOWN_EXAMPLES = [
  {
    name: 'Подзаголовок раздела',
    syntax: '## Главная ошибка новичков',
    hint: 'Крупный жирный заголовок для разделения блоков текста',
  },
  {
    name: 'Подзаголовок поменьше',
    syntax: '### Шаг 1. Подготовка',
    hint: 'Используется внутри больших разделов',
  },
  {
    name: 'Жирный акцент',
    syntax: '**Пауза перед ключевой мыслью**',
    hint: 'Выделяет главные тезисы в абзаце',
  },
  {
    name: 'Курсив',
    syntax: '*Пример из практики*',
    hint: 'Подходит для ремарок и интонационных акцентов',
  },
  {
    name: 'Маркированный список',
    syntax: '- Первый пункт\n- Второй пункт',
    hint: 'Каждый пункт с новой строки через дефис и пробел',
  },
  {
    name: 'Нумерованный список',
    syntax: '1. Вступление\n2. Аргумент\n3. Вывод',
    hint: 'Для пошаговых алгоритмов и правил',
  },
  {
    name: 'Выделенная цитата / Совет',
    syntax: '> Никогда не извиняйтесь перед выходом на сцену.',
    hint: 'Оформится в красивую синюю плашку-выноску',
  },
  {
    name: 'Ссылка',
    syntax: '[Текст ссылки](https://govorix.ru)',
    hint: 'Кликабельная ссылка в тексте',
  },
]

const MarkdownHelpModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modal_header}>
          <h3 className={styles.modal_title}>Шпаргалка по Markdown</h3>
          <button
            type="button"
            className={styles.close_icon_btn}
            onClick={onClose}
            aria-label="Закрыть шпаргалку"
          >
            <TbX size={20} />
          </button>
        </div>

        <p className={styles.intro_text}>
          Используйте эти символы в тексте статьи, чтобы оформить заголовки,
          списки и акценты. Между абзацами оставляйте пустую строку.
        </p>

        <div className={styles.examples_list}>
          {MARKDOWN_EXAMPLES.map((item, index) => (
            <div key={index} className={styles.example_card}>
              <div className={styles.example_header}>{item.name}</div>
              <pre className={styles.syntax_box}>{item.syntax}</pre>
              <div className={styles.example_hint}>{item.hint}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.close_modal_btn}
          onClick={onClose}
        >
          Понятно
        </button>
      </div>
    </div>
  )
}

export default MarkdownHelpModal
