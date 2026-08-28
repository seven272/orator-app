import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import {
  fetchChallenges,
  fetchSubmitChallengeReport,
  resetChallengesState,
} from '../../../redux/slices/challengeSlice'
import styles from './Challenges.module.css'

const Challenges = () => {
  const dispatch = useDispatch()

  // Берем данные из нового слайса челленджей
  const {
    list: challenges,
    status,
    submitStatus,
  } = useSelector((state) => state.challenge)

  const [activeChallengeId, setActiveChallengeId] = useState(null)
  const [reportText, setReportText] = useState('')

  useEffect(() => {
    dispatch(fetchChallenges())

    return () => {
      dispatch(resetChallengesState())
    }
  }, [dispatch])

  const handleSubmitReport = async (challengeId) => {
    if (!reportText.trim()) return

    try {
      await dispatch(
        fetchSubmitChallengeReport({
          challengeId,
          textReport: reportText,
        }),
      ).unwrap()
      // Этот код выполнится ТОЛЬКО в случае успеха (fulfilled)
      setReportText('')
      setActiveChallengeId(null)
      message.success('Отчет успешно отправлен')
    } catch (error) {
      message.error(error?.message || 'Ошибка отправки отчета')
    }
  }

  if (status === 'loading')
    return (
      <div className={styles.loader}>
        Загрузка испытаний реального мира...
      </div>
    )

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔥 Испытания в бою</h2>
      <p className={styles.subtitle}>
        Закрепи полученные навыки в реальной жизни и получи награду
      </p>

      <div className={styles.list}>
        {challenges.map((ch) => {
          const isCompleted = ch.status === 'completed'
          const isOpen = activeChallengeId === ch.id

          return (
            <div
              key={ch.id}
              className={`${styles.card} ${isCompleted ? styles.card_completed : ''}`}
            >
              <div className={styles.card_header}>
                <span className={styles.skill_badge}>
                  {ch.targetSkill}
                </span>
                <span className={styles.reward_badge}>
                  🎁 +{ch.reward.xp} XP
                </span>
              </div>

              <h3 className={styles.card_title}>{ch.title}</h3>
              <p className={styles.card_description}>
                {ch.description}
              </p>

              {isCompleted ? (
                <div className={styles.completed_label}>
                  ✅ Выполнено! Отчет отправлен.
                </div>
              ) : (
                <>
                  {!isOpen ? (
                    <button
                      className={styles.action_button}
                      onClick={() => setActiveChallengeId(ch.id)}
                    >
                      Принять вызов
                    </button>
                  ) : (
                    <div className={styles.form_zone}>
                      <div className={styles.divider} />
                      <p className={styles.instruction}>
                        <strong>Задание:</strong> {ch.instruction}
                      </p>
                      <textarea
                        className={styles.textarea}
                        placeholder="Напиши сюда свой отчет о выполнении..."
                        value={reportText}
                        onChange={(e) =>
                          setReportText(e.target.value)
                        }
                        rows={3}
                      />
                      <div className={styles.btn_group}>
                        <button
                          className={styles.submit_btn}
                          onClick={() => handleSubmitReport(ch.id)}
                          disabled={
                            submitStatus === 'loading' ||
                            reportText.trim().length < 10
                          }
                        >
                          {submitStatus === 'loading'
                            ? 'Отправка...'
                            : 'Подтвердить выполнение'}
                        </button>
                        <button
                          className={styles.cancel_btn}
                          onClick={() => {
                            setActiveChallengeId(null)
                            setReportText('')
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Challenges
