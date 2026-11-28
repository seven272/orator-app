import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { TbBook2, TbCalendarEvent, TbSettings } from 'react-icons/tb'

import styles from './EducationHubLayout.module.css'

const EducationHubLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const { user: authUser } = useSelector((state) => state.auth)
  const isAdmin = Boolean(authUser?.isAdmin)

  const pathname = location.pathname
  const isEventsTab = pathname.startsWith('/hub/events')

  // Показываем верхние табы только на основных страницах списков (/hub/knowledge и /hub/events)
  const isRootTabPage =
    pathname === '/hub' ||
    pathname === '/hub/knowledge' ||
    pathname === '/hub/events'

  return (
    <div className={styles.hub_theme_bg}>
      <div className={styles.hub_container}>
        {isRootTabPage && (
          <header className={styles.hub_header}>
            <div className={styles.hub_title_row}>
              <div>
                <h1 className={styles.hub_title}>Академия Govorix</h1>
                <p className={styles.hub_subtitle}>
                  Теория, разборы выступлений и живая практика
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  className={styles.admin_manage_btn}
                  onClick={() => navigate('/admin')}
                  title="Управление материалами и афишей"
                >
                  <TbSettings size={18} />
                  <span>Управление</span>
                </button>
              )}
            </div>

            <nav className={styles.tabs_switcher} aria-label="Разделы Академии">
              <button
                type="button"
                className={`${styles.tab_btn} ${
                  !isEventsTab ? styles.tab_btn_active : ''
                }`}
                onClick={() => navigate('/hub/knowledge')}
              >
                <TbBook2 size={18} />
                <span>База знаний</span>
              </button>

              <button
                type="button"
                className={`${styles.tab_btn} ${
                  isEventsTab ? styles.tab_btn_active : ''
                }`}
                onClick={() => navigate('/hub/events')}
              >
                <TbCalendarEvent size={18} />
                <span>Афиша</span>
              </button>
            </nav>
          </header>
        )}

        <div className={styles.hub_content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default EducationHubLayout
