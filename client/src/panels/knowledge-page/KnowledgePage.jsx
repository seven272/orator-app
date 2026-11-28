import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import { TbSearch, TbX } from 'react-icons/tb'

import {
  fetchGetKnowledgeList,
  setKnowledgeFilters,
} from '../../redux/slices/educationHubSlice'
import { getSkillOptions } from '../../utils/skillsHelper'
import KnowledgeCard from './knowledge-card/KnowledgeCard'

import styles from './KnowledgePage.module.css'

const FORMAT_TABS = [
  { key: 'all', label: 'Все' },
  { key: 'article', label: 'Статьи' },
  { key: 'video', label: 'Видеоразборы' },
]

const KnowledgePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const { knowledgeItems, knowledgeFilters, isLoadingList } = useSelector(
    (state) => state.educationHub
  )

  const [searchQuery, setSearchQuery] = useState('')
  const skillOptions = useMemo(() => getSkillOptions(), [])

  // Синхронизация фильтра навыка с URL (?skill=...)
  useEffect(() => {
    const skillFromUrl = searchParams.get('skill')
    if (skillFromUrl && skillFromUrl !== knowledgeFilters.skillTag) {
      dispatch(setKnowledgeFilters({ skillTag: skillFromUrl }))
    }
  }, [searchParams, dispatch, knowledgeFilters.skillTag])

  // Загрузка списка при изменении серверных фильтров (формат и навык)
  useEffect(() => {
    const params = {}
    if (knowledgeFilters.type !== 'all') {
      params.type = knowledgeFilters.type
    }
    if (knowledgeFilters.skillTag) {
      params.skillTag = knowledgeFilters.skillTag
    }
    dispatch(fetchGetKnowledgeList(params))
  }, [dispatch, knowledgeFilters.type, knowledgeFilters.skillTag])

  // Клиентская фильтрация по поисковой строке
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return knowledgeItems

    return knowledgeItems.filter((item) => {
      const inTitle = item.title?.toLowerCase().includes(q)
      const inSummary = item.summary?.toLowerCase().includes(q)
      return inTitle || inSummary
    })
  }, [knowledgeItems, searchQuery])

  const handleTypeChange = (typeKey) => {
    dispatch(setKnowledgeFilters({ type: typeKey }))
  }

  const handleSkillChange = (skillKey) => {
    const nextSkill = knowledgeFilters.skillTag === skillKey ? '' : skillKey
    dispatch(setKnowledgeFilters({ skillTag: nextSkill }))

    if (nextSkill) {
      setSearchParams({ skill: nextSkill })
    } else {
      setSearchParams({})
    }
  }

  const handleOpenMaterial = (slug) => {
    navigate(`/hub/knowledge/${slug}`)
  }

  return (
    <div className={styles.knowledge_page}>
      {/* Строка поиска по материалам */}
      <div className={styles.search_box}>
        <TbSearch size={18} className={styles.search_icon} />
        <input
          type="text"
          className={styles.search_input}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по темам, приемам, разборам..."
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.clear_search_btn}
            onClick={() => setSearchQuery('')}
            aria-label="Очистить поиск"
          >
            <TbX size={16} />
          </button>
        )}
      </div>

      {/* Фильтр по формату (Все / Статьи / Видеоразборы) */}
      <div className={styles.format_pills}>
        {FORMAT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.format_pill} ${
              knowledgeFilters.type === tab.key ? styles.format_pill_active : ''
            }`}
            onClick={() => handleTypeChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Горизонтальный скролл чипсов по навыкам */}
      {skillOptions.length > 0 && (
        <div className={styles.skills_scroll_row}>
          <button
            type="button"
            className={`${styles.skill_chip} ${
              !knowledgeFilters.skillTag ? styles.skill_chip_active : ''
            }`}
            onClick={() => handleSkillChange('')}
          >
            Все навыки
          </button>

          {skillOptions.map((skill) => (
            <button
              key={skill.key}
              type="button"
              className={`${styles.skill_chip} ${
                knowledgeFilters.skillTag === skill.key
                  ? styles.skill_chip_active
                  : ''
              }`}
              onClick={() => handleSkillChange(skill.key)}
            >
              {skill.label}
            </button>
          ))}
        </div>
      )}

      {/* Контент */}
      {isLoadingList ? (
        <div className={styles.loader_box}>
          <Spin size="large" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.empty_box}>
          <Empty
            description={
              searchQuery
                ? `По запросу «${searchQuery}» ничего не найдено`
                : 'По выбранным фильтрам материалов пока нет'
            }
          />
        </div>
      ) : (
        <div className={styles.cards_list}>
          {filteredItems.map((item) => (
            <KnowledgeCard
              key={item._id}
              item={item}
              onSelect={handleOpenMaterial}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default KnowledgePage
