import React from 'react'
import styles from './UserPurchasesTab.module.css'

const STATUS_LABELS = {
  in_progress: { text: 'В процессе', cls: 'status_progress' },
  completed: { text: 'Пройден ✓', cls: 'status_completed' },
  failed: { text: 'Провален', cls: 'status_failed' },
}

const UserPurchasesTab = ({
  coursesProgress = [],
  eventTickets = [],
  inventory = [],
  availableCourses = [],
}) => {
  const getCourseTitle = (code) =>
    availableCourses.find((c) => c.code === code)?.title || code

  return (
    <div className={styles.wrap}>
      {/* 1. Прогресс по курсам */}
      <section className={styles.block}>
        <h4 className={styles.block_title}>
          🎓 Прогресс по курсам ({coursesProgress.length})
        </h4>
        {coursesProgress.length === 0 ? (
          <div className={styles.empty_text}>Нет начатых курсов</div>
        ) : (
          coursesProgress.map((cp) => {
            const st = STATUS_LABELS[cp.status] || {
              text: cp.status,
              cls: 'status_progress',
            }
            return (
              <div key={cp._id} className={styles.item_card}>
                <div className={styles.row_top}>
                  <span className={styles.item_name}>
                    {getCourseTitle(cp.courseCode)}
                  </span>
                  <span className={`${styles.badge} ${styles[st.cls]}`}>
                    {st.text}
                  </span>
                </div>
                <div className={styles.row_sub}>
                  <span>День: {cp.currentDay || 1}</span>
                  <span>Баллы: {cp.score || 0}</span>
                </div>
              </div>
            )
          })
        )}
      </section>

      {/* 2. Билеты на мероприятия */}
      <section className={styles.block}>
        <h4 className={styles.block_title}>
          🎟️ Билеты на мероприятия ({eventTickets.length})
        </h4>
        {eventTickets.length === 0 ? (
          <div className={styles.empty_text}>Билетов пока нет</div>
        ) : (
          eventTickets.map((ticket) => (
            <div key={ticket.orderId} className={styles.item_card}>
              <div className={styles.row_top}>
                <span className={styles.item_name}>{ticket.title}</span>
                <span className={styles.price_pill}>{ticket.amount} ₽</span>
              </div>
              <div className={styles.row_sub}>
                <span>
                  {ticket.format === 'offline'
                    ? `Офлайн · ${ticket.city}`
                    : 'Онлайн'}
                </span>
                <span>
                  Куплен:{' '}
                  {new Date(ticket.purchasedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* 3. Инвентарь (бусты и мерч) */}
      <section className={styles.block}>
        <h4 className={styles.block_title}>
          🎒 Инвентарь ({inventory.length})
        </h4>
        {inventory.length === 0 ? (
          <div className={styles.empty_text}>Инвентарь пуст</div>
        ) : (
          inventory.map((item, idx) => (
            <div key={item._id || idx} className={styles.item_card}>
              <div className={styles.row_top}>
                <span className={styles.item_name}>{item.itemCode}</span>
                <span className={styles.qty_badge}>× {item.quantity || 1}</span>
              </div>
              {item.purchasedAt && (
                <div className={styles.row_sub}>
                  <span>
                    Дата:{' '}
                    {new Date(item.purchasedAt).toLocaleDateString('ru-RU')}
                  </span>
                  {item.deliveryAddress && (
                    <span>
                      {item.isShipped ? '📦 Отправлен' : '⏳ Ожидает отправки'}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  )
}

export default UserPurchasesTab
