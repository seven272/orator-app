import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message, Popconfirm, Spin } from 'antd'
import {
  TbPlus,
  TbEdit,
  TbTrash,
  TbEye,
  TbArticle,
  TbBrandYoutube,
} from 'react-icons/tb'

import {
  fetchGetKnowledgeList,
  fetchGetKnowledgeBySlug,
  fetchDeleteKnowledgeItem,
} from '../../../redux/slices/educationHubSlice'
import { getSkillLabel } from '../../../utils/skillsHelper'
import KnowledgeFormModal from './knowledge-form-modal/KnowledgeFormModal'

import styles from './KnowledgeManagement.module.css'

const KnowledgeManagement = () => {
  const dispatch = useDispatch()
  const { knowledgeItems, isLoadingList } = useSelector(
    (state) => state.educationHub
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    dispatch(fetchGetKnowledgeList({ includeDrafts: 'true' }))
  }, [dispatch])

  const openCreateModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const openEditModal = async (item) => {
    try {
      const fullItem = await dispatch(
        fetchGetKnowledgeBySlug(item.slug)
      ).unwrap()
      setEditingItem(fullItem)
      setIsModalOpen(true)
    } catch (err) {
      message.error('Не удалось загрузить данные материала')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(fetchDeleteKnowledgeItem(id)).unwrap()
      message.success('Материал удален')
    } catch (err) {
      message.error(err || 'Не удалось удалить материал')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.top_bar}>
        <h2 className={styles.section_title}>
          Материалы ({knowledgeItems.length})
        </h2>
        <button
          type="button"
          className={styles.add_btn}
          onClick={openCreateModal}
        >
          <TbPlus size={18} />
          <span>Добавить материал</span>
        </button>
      </div>

      {isLoadingList ? (
        <div className={styles.loader_box}>
          <Spin />
        </div>
      ) : (
        <div className={styles.items_list}>
          {knowledgeItems.map((item) => (
            <div key={item._id} className={styles.item_row}>
              <div className={styles.item_info}>
                <div className={styles.badges_row}>
                  <span
                    className={`${styles.type_badge} ${
                      item.type === 'video'
                        ? styles.badge_video
                        : styles.badge_article
                    }`}
                  >
                    {item.type === 'video' ? (
                      <>
                        <TbBrandYoutube size={13} /> Видео
                      </>
                    ) : (
                      <>
                        <TbArticle size={13} /> Статья
                      </>
                    )}
                  </span>

                  {item.skillTag && (
                    <span className={styles.draft_badge}>
                      {getSkillLabel(item.skillTag)}
                    </span>
                  )}

                  {!item.isPublished && (
                    <span className={styles.draft_badge}>Черновик</span>
                  )}

                  <span className={styles.views_text}>
                    <TbEye size={13} /> {item.viewsCount || 0}
                  </span>
                </div>

                <div className={styles.item_title}>{item.title}</div>
                <div className={styles.item_slug}>
                  /hub/knowledge/{item.slug}
                </div>
              </div>

              <div className={styles.actions_col}>
                <button
                  type="button"
                  className={styles.icon_btn}
                  onClick={() => openEditModal(item)}
                  title="Редактировать"
                >
                  <TbEdit size={18} />
                </button>

                <Popconfirm
                  title="Удалить материал?"
                  description="Это действие нельзя отменить."
                  onConfirm={() => handleDelete(item._id)}
                  okText="Да"
                  cancelText="Нет"
                >
                  <button
                    type="button"
                    className={`${styles.icon_btn} ${styles.delete_btn}`}
                    title="Удалить"
                  >
                    <TbTrash size={18} />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      <KnowledgeFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialItem={editingItem}
      />
    </div>
  )
}

export default KnowledgeManagement
