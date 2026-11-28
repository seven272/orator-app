import KnowledgeItem from '../models/KnowledgeItem.js'

// Вспомогательная функция: извлекает платформу и ID из ссылки YouTube или RuTube
const parseVideoUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { platform: '', videoId: '' }
  }

  const trimmedUrl = url.trim()

  // Проверка YouTube (://youtube.com..., youtu.be/..., ://youtube.com...)
  const ytMatch = trimmedUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch && ytMatch[1]) {
    return { platform: 'youtube', videoId: ytMatch[1] }
  }

  // Проверка RuTube (rutube.ru/video/..., rutube.ru/play/embed/...)
  const rtMatch = trimmedUrl.match(
    /rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9]+)/
  )
  if (rtMatch && rtMatch[1]) {
    return { platform: 'rutube', videoId: rtMatch[1] }
  }

  return { platform: '', videoId: '' }
}

// 1. Получить список материалов (для пользователей — только опубликованные, для админа — все)
export const getKnowledgeList = async (req, res) => {
  try {
    const { type, skillTag, includeDrafts } = req.query

    const filter = {}

    // Если не запрошены черновики (или юзер не админ), показываем только опубликованные
    if (includeDrafts !== 'true') {
      filter.isPublished = true
    }

    if (type && ['article', 'video'].includes(type)) {
      filter.type = type
    }

    if (skillTag) {
      filter.skillTag = skillTag
    }

    // Исключаем полный текст статьи для быстрой загрузки списка
    const items = await KnowledgeItem.find(filter)
      .select('-contentMarkdown')
      .sort({ createdAt: -1 })

    return res.json(items)
  } catch (error) {
    console.error('Ошибка при получении списка Базы знаний:', error)
    return res.status(500).json({ message: 'Не удалось загрузить материалы' })
  }
}

// 2. Получить конкретный материал по slug
export const getKnowledgeBySlug = async (req, res) => {
  try {
    const { slug } = req.params

    const item = await KnowledgeItem.findOne({ slug })
    if (!item) {
      return res.status(404).json({ message: 'Материал не найден' })
    }

    // Простое увеличение счетчика просмотров
    item.viewsCount = (item.viewsCount || 0) + 1
    await item.save()

    return res.json(item)
  } catch (error) {
    console.error('Ошибка при получении материала по slug:', error)
    return res.status(500).json({ message: 'Не удалось загрузить материал' })
  }
}

// 3. [ADMIN] Создать новый материал (статью или видео)
export const createKnowledgeItem = async (req, res) => {
  try {
    const {
      title,
      slug,
      type,
      summary,
      contentMarkdown,
      coverImage,
      videoUrl,
      skillTag,
      relatedExerciseAlias,
      isPublished,
    } = req.body

    if (!title || !slug) {
      return res
        .status(400)
        .json({ message: 'Заголовок и slug обязательны для заполнения' })
    }

    const existingSlug = await KnowledgeItem.findOne({ slug: slug.trim() })
    if (existingSlug) {
      return res
        .status(400)
        .json({ message: 'Материал с таким slug уже существует' })
    }

    let videoData = { platform: '', videoId: '' }
    if (type === 'video' && videoUrl) {
      videoData = parseVideoUrl(videoUrl)
      if (!videoData.videoId) {
        return res.status(400).json({
          message: 'Некорректная ссылка. Поддерживаются только YouTube и RuTube',
        })
      }
    }

    const newItem = await KnowledgeItem.create({
      title: title.trim(),
      slug: slug.trim(),
      type: type || 'article',
      summary: summary || '',
      contentMarkdown: contentMarkdown || '',
      coverImage: coverImage || '',
      video: videoData,
      skillTag: skillTag || '',
      relatedExerciseAlias: relatedExerciseAlias || '',
      isPublished: isPublished !== undefined ? isPublished : true,
      authorId: req.userId,
    })

    return res.status(201).json(newItem)
  } catch (error) {
    console.error('Ошибка при создании материала:', error)
    return res.status(500).json({ message: 'Не удалось создать материал' })
  }
}

// 4. [ADMIN] Обновить существующий материал
export const updateKnowledgeItem = async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      slug,
      type,
      summary,
      contentMarkdown,
      coverImage,
      videoUrl,
      skillTag,
      relatedExerciseAlias,
      isPublished,
    } = req.body

    const item = await KnowledgeItem.findById(id)
    if (!item) {
      return res.status(404).json({ message: 'Материал не найден' })
    }

    if (slug && slug.trim() !== item.slug) {
      const slugTaken = await KnowledgeItem.findOne({ slug: slug.trim() })
      if (slugTaken) {
        return res
          .status(400)
          .json({ message: 'Этот slug уже занят другим материалом' })
      }
      item.slug = slug.trim()
    }

    if (title !== undefined) item.title = title.trim()
    if (type !== undefined) item.type = type
    if (summary !== undefined) item.summary = summary
    if (contentMarkdown !== undefined) item.contentMarkdown = contentMarkdown
    if (coverImage !== undefined) item.coverImage = coverImage
    if (skillTag !== undefined) item.skillTag = skillTag
    if (relatedExerciseAlias !== undefined) {
      item.relatedExerciseAlias = relatedExerciseAlias
    }
    if (isPublished !== undefined) item.isPublished = isPublished

    if (item.type === 'video' && videoUrl) {
      const parsed = parseVideoUrl(videoUrl)
      if (!parsed.videoId) {
        return res.status(400).json({
          message: 'Некорректная ссылка на видео (нужен YouTube или RuTube)',
        })
      }
      item.video = parsed
    } else if (item.type === 'article') {
      item.video = { platform: '', videoId: '' }
    }

    await item.save()
    return res.json(item)
  } catch (error) {
    console.error('Ошибка при обновлении материала:', error)
    return res.status(500).json({ message: 'Не удалось обновить материал' })
  }
}

// 5. [ADMIN] Удалить материал
export const deleteKnowledgeItem = async (req, res) => {
  try {
    const { id } = req.params

    const item = await KnowledgeItem.findById(id)
    if (!item) {
      return res.status(404).json({ message: 'Материал не найден' })
    }

    await item.deleteOne()
    return res.json({ message: 'Материал успешно удален', id })
  } catch (error) {
    console.error('Ошибка при удалении материала:', error)
    return res.status(500).json({ message: 'Не удалось удалить материал' })
  }
}
