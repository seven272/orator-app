import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'
import {
  fetchMergeAccounts,
  clearMergeConflict,
} from '../../../../redux/slices/authSlice'
import { validatePassword } from '../../../../utils/passwordValidator'
import styles from './AccountMergeContent.module.css'

const AccountMergeContent = () => {
  const dispatch = useDispatch()
  const { user, mergeConflict, isLoading } = useSelector(
    (state) => state.auth,
  )
  // Храним выбор пользователя: 'current' (оставить этот) или 'target' (загрузить старый)
  const [selectedPlatform, setSelectedPlatform] = useState('current')

  const [confirmPassword, setConfirmPassword] = useState('')

  // 2. Модифицируем хэндлер отправки, дописывая туда пароль
  const handleMergeSubmit = async () => {
    if (!confirmPassword.trim()) {
      message.error(
        'Введите пароль от старого аккаунта для подтверждения прав!',
      )
      return
    }

    const validation = validatePassword(confirmPassword, user?.email)

  if (!validation.isValid) {
    message.error(validation.message) // Выводим четкий понятный текст ошибки
    return
  }

    if (!mergeConflict?.targetUserId) {
      // Сценарий для привязки Email (когда ID второго аккаунта не передается, бэкенд связывает по сессии)
      // Если привязывали Email и возник конфликт, targetUserId может быть пустым, бэкенд обработает это
    }

    try {
      await dispatch(
        fetchMergeAccounts({
          targetUserId: mergeConflict?.targetUserId,
          chosenPlatform: selectedPlatform,
          password: confirmPassword, // 🔥 ПЕРЕДАЕМ ПАРОЛЬ НА БЭКЕНД
        }),
      ).unwrap()
      message.success('Аккаунты успешно объединены!')
    } catch (err) {
      message.error(err || 'Неверный пароль или ошибка слияния')
    }
  }

  // Определяем тип конфликта для понятного текста
  const isVkConflict = mergeConflict?.code === 'VK_ALREADY_TAKEN'

  return (
    <div className={styles.mergeWrapper}>
      <h3 className={styles.title}>Объединение профилей</h3>
      <p className={styles.description}>
        {isVkConflict
          ? 'Этот аккаунт ВКонтакте уже привязан к другому пользователю нашего сервиса. Выберите, какой игровой прогресс вы хотите сохранить:'
          : 'Пользователь с таким Email уже существует. Выберите, какой игровой прогресс вы хотите оставить главным:'}
      </p>

      {/* --- СЕТКА КАРТОЧЕК --- */}
      <div className={styles.cardsGrid}>
        {/* КАРТОЧКА 1: ТЕКУЩИЙ АККАУНТ */}
        <div
          className={`${styles.mergeCard} ${selectedPlatform === 'current' ? styles.selected : ''}`}
          onClick={() => setSelectedPlatform('current')}
        >
          <div className={styles.radioIndicator}></div>
          <span className={styles.cardLabel}>Оставить текущий</span>

          <div className={styles.profileSummary}>
            <img
              src={user?.avatar}
              alt="Avatar"
              className={styles.avatarMini}
            />
            <span className={styles.name}>@{user?.displayName}</span>
            <span className={styles.metric}>
              🏆 Уровень: {user?.progression?.level}
            </span>
            <span className={styles.metric}>
              🪙 Монеты: {user?.progression?.coins}
            </span>
          </div>
          <p className={styles.warningText}>
            Второй аккаунт будет удален, но его социальные сети
            привяжутся сюда.
          </p>
        </div>

        {/* КАРТОЧКА 2: КОНФЛИКТУЮЩИЙ АККАУНТ */}
        <div
          className={`${styles.mergeCard} ${selectedPlatform === 'target' ? styles.selected : ''}`}
          onClick={() => setSelectedPlatform('target')}
        >
          <div className={styles.radioIndicator}></div>
          <span className={styles.cardLabel}>Загрузить старый</span>

          <div className={styles.profileSummary}>
            {/* Для старого аккаунта мы знаем только ID. Показываем заглушку, так как прогресс перезапишется им */}
            <div className={styles.avatarPlaceholder}>🔄</div>
            <span className={styles.name}>
              {isVkConflict ? 'Профиль из VK' : 'Профиль с Сайта'}
            </span>
            <span className={styles.metricSub}>
              Восстановит ваш старый прогресс и привяжет к нему
              текущую сессию.
            </span>
          </div>
          <p className={styles.warningText}>
            Текущий прогресс (Уровень {user?.progression?.level})
            будет безвозвратно утерян.
          </p>
        </div>
      </div>

      {/* 🔥 НОВЫЙ БЛОК ПОДТВЕРЖДЕНИЯ ПАРОЛЕМ */}
      <div className={styles.password_block}>
        <label>
          🔑 Введите пароль от аккаунта Сайта для подтверждения:
        </label>
        <input
          type="password"
          placeholder="Пароль от привязываемой почты"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {/* --- КНОПКИ ДЕЙСТВИЯ --- */}
      <div className={styles.actions}>
        <button
          className={styles.cancelBtn}
          onClick={() => dispatch(clearMergeConflict())}
          disabled={isLoading}
        >
          Отмена
        </button>
        <button
          className={styles.confirmBtn}
          onClick={handleMergeSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Объединение...' : 'Подтвердить объединение'}
        </button>
      </div>
    </div>
  )
}

export default AccountMergeContent
