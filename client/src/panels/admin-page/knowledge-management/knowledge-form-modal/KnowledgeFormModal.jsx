import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { TbX, TbHelp } from 'react-icons/tb'

import {
  fetchCreateKnowledgeItem,
  fetchUpdateKnowledgeItem,
  fetchGetKnowledgeList,
} from '../../../../redux/slices/educationHubSlice'
import {
  getSkillOptions,
  getExercisesBySkill,
} from '../../../../utils/skillsHelper'
import MarkdownHelpModal from '../../../../components/modal/markdown-help-modal/MarkdownHelpModal'

import styles from './KnowledgeFormModal.module.css'

const generateSlug = (text) => {
  const ruMap = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map((char) => (ruMap[char] !== undefined ? ruMap[char] : char))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  type: 'article',
  summary: '',
  contentMarkdown: '',
  coverImage: '',
  videoUrl: '',
  skillTag: '',
  relatedExerciseAlias: '',
  isPublished: true,
}

const KnowledgeFormModal = ({
  isOpen,
  onClose,
  initialItem = null,
}) => {
  const dispatch = useDispatch()
  const { isSubmitting } = useSelector((state) => state.educationHub)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const skillOptions = useMemo(() => getSkillOptions(), [])
  const suggestedExercises = useMemo(
    () => getExercisesBySkill(formData.skillTag),
    [formData.skillTag],
  )

  // Заполняем форму при открытии (создание или редактирование)
  useEffect(() => {
    if (!isOpen) return

    if (initialItem) {
      let reconstructedVideoUrl = ''
      if (
        initialItem.type === 'video' &&
        initialItem.video?.videoId
      ) {
        reconstructedVideoUrl =
          initialItem.video.platform === 'rutube'
            ? `https://rutube.ru{initialItem.video.videoId}/`
            : `https://youtube.com{initialItem.video.videoId}`
      }

      setSlugManuallyEdited(true)
      setFormData({
        title: initialItem.title || '',
        slug: initialItem.slug || '',
        type: initialItem.type || 'article',
        summary: initialItem.summary || '',
        contentMarkdown: initialItem.contentMarkdown || '',
        coverImage: initialItem.coverImage || '',
        videoUrl: reconstructedVideoUrl,
        skillTag: initialItem.skillTag || '',
        relatedExerciseAlias: initialItem.relatedExerciseAlias || '',
        isPublished:
          initialItem.isPublished !== undefined
            ? initialItem.isPublished
            : true,
      })
    } else {
      setSlugManuallyEdited(false)
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, initialItem])

  // Блокировка скролла фона и закрытие по Escape
  useEffect(() => {
    if (!isOpen) return

    const originalStyle = window.getComputedStyle(
      document.body,
    ).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isHelpOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isHelpOpen, onClose])

  if (!isOpen) return null

  const handleTitleChange = (e) => {
    const nextTitle = e.target.value
    setFormData((prev) => ({
      ...prev,
      title: nextTitle,
      slug: slugManuallyEdited ? prev.slug : generateSlug(nextTitle),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.slug.trim()) {
      message.warning(
        'Заполните заголовок и URL-идентификатор (slug)',
      )
      return
    }

    try {
      if (initialItem?._id) {
        await dispatch(
          fetchUpdateKnowledgeItem({
            id: initialItem._id,
            payload: formData,
          }),
        ).unwrap()
        message.success('Материал обновлен')
      } else {
        await dispatch(fetchCreateKnowledgeItem(formData)).unwrap()
        message.success('Материал создан')
      }
      dispatch(fetchGetKnowledgeList({ includeDrafts: 'true' }))
      onClose()
    } catch (err) {
      message.error(err || 'Ошибка при сохранении материала')
    }
  }

  return (
    <>
      <div className={styles.modal_overlay} onClick={onClose}>
        <div
          className={styles.modal_content}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modal_header}>
            <h3 className={styles.modal_title}>
              {initialItem
                ? 'Редактировать материал'
                : 'Новый материал'}
            </h3>
            <button
              type="button"
              className={styles.close_icon_btn}
              onClick={onClose}
              aria-label="Закрыть окно"
            >
              <TbX size={20} />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field_group}>
              <label className={styles.label}>Формат материала</label>
              <div className={styles.radio_row}>
                <button
                  type="button"
                  className={`${styles.radio_btn} ${
                    formData.type === 'article'
                      ? styles.radio_btn_active
                      : ''
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, type: 'article' })
                  }
                >
                  Статья (Markdown)
                </button>
                <button
                  type="button"
                  className={`${styles.radio_btn} ${
                    formData.type === 'video'
                      ? styles.radio_btn_active
                      : ''
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, type: 'video' })
                  }
                >
                  Видеоразбор (YouTube / RuTube)
                </button>
              </div>
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>Заголовок *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Например: Как убрать слова-паразиты за 5 минут"
                required
              />
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>
                URL-адрес (slug) *
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  setFormData({ ...formData, slug: e.target.value })
                }}
                placeholder="kak-ubrat-slova-parazity"
                required
              />
            </div>

            {formData.type === 'video' && (
              <div className={styles.field_group}>
                <label className={styles.label}>
                  Ссылка на YouTube или RuTube *
                </label>
                <input
                  type="url"
                  className={styles.input}
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      videoUrl: e.target.value,
                    })
                  }
                  placeholder="https://youtube.com... или https://rutube.ru..."
                  required
                />
              </div>
            )}

            <div className={styles.two_cols}>
              <div className={styles.field_group}>
                <label className={styles.label}>
                  Навык (SKILLS_MAP)
                </label>
                <select
                  className={styles.select}
                  value={formData.skillTag}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skillTag: e.target.value,
                    })
                  }
                >
                  <option value="">Без привязки</option>
                  {skillOptions.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field_group}>
                <label className={styles.label}>
                  Алиас тренажера
                </label>
                <input
                  type="text"
                  list="suggested-exercises-list"
                  className={styles.input}
                  value={formData.relatedExerciseAlias}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      relatedExerciseAlias: e.target.value,
                    })
                  }
                  placeholder="Выберите или введите"
                />
                <datalist id="suggested-exercises-list">
                  {suggestedExercises.map((alias) => (
                    <option key={alias} value={alias} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>
                Ссылка на обложку
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coverImage: e.target.value,
                  })
                }
                placeholder="https://..."
              />
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>
                Краткое описание (анонс)
              </label>
              <textarea
                className={styles.textarea_small}
                value={formData.summary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    summary: e.target.value,
                  })
                }
                placeholder="1–2 предложения о чем этот материал..."
              />
            </div>

            <div className={styles.field_group}>
              <div className={styles.label_with_help}>
                <label className={styles.label}>
                  {formData.type === 'video'
                    ? 'Таймкоды или конспект (Markdown)'
                    : 'Текст статьи (Markdown)'}
                </label>
                <button
                  type="button"
                  className={styles.help_trigger_btn}
                  onClick={() => setIsHelpOpen(true)}
                  title="Справка по Markdown-разметке"
                >
                  <TbHelp size={15} />
                  <span>Разметка</span>
                </button>
              </div>

              <textarea
                className={styles.textarea_large}
                value={formData.contentMarkdown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contentMarkdown: e.target.value,
                  })
                }
                placeholder="Используйте ## для подзаголовков, **жирный текст**, списки - ..."
              />
            </div>

            <label className={styles.checkbox_row}>
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isPublished: e.target.checked,
                  })
                }
              />
              <span>Опубликовано (видно пользователям)</span>
            </label>

            <button
              type="submit"
              className={styles.submit_btn}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Сохраняем...'
                : initialItem
                  ? 'Сохранить изменения'
                  : 'Создать материал'}
            </button>
          </form>
        </div>
      </div>

      <MarkdownHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  )
}

export default KnowledgeFormModal
