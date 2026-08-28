// Shop.jsx
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  fetchShopItems,
  fetchPurchaseItem,
  resetShopStatus,
} from '../../../redux/slices/shopSlice'

import styles from './Shop.module.css'
import ShopAddressModal from './shop-address-modal/ShopAddressModal.jsx'

const Shop = () => {
  const dispatch = useDispatch()

  // Получаем баланс жетонов из профиля пользователя
  const userCoins = useSelector(
    (state) =>
      state.profile.user?.progression?.coins ||
      state.profile.user?.coins ||
      0,
  )

  // Получаем инвентарь пользователя
  const userInventory = useSelector(
    (state) => state.profile.user?.inventory || [],
  )

  // Получаем состояние витрины магазина
  const { items, status, purchaseStatus, error } = useSelector(
    (state) => state.shop,
  )

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingItem, setPendingItem] = useState(null)

  // Соответствие технических имен иконок визуальным эмодзи
  const iconMap = {
    freeze: '❄️',
    'theme-cyber': '🌐',
    'crown-title': '👑',
    'ai-prompt': '💡', // Суфлер ИИ
    'color-glow': '✨', // Неоновый ник
    'physical-badge': '🏅', // Физический значок
    'physical-diploma': '📜', // Настоящий диплом в рамке
  }

  useEffect(() => {
    dispatch(fetchShopItems())
    // Очистка экшенов при размонтировании экрана
    return () => dispatch(resetShopStatus())
  }, [dispatch])

  // Контроль модальных окон и алертов по статусу транзакции
  useEffect(() => {
    if (purchaseStatus === 'failed' && error) {
      alert(error.message || 'Ошибка транзакции')
      dispatch(resetShopStatus())
    }
    if (purchaseStatus === 'succeeded') {
      setIsModalOpen(false)
      setPendingItem(null)
      dispatch(resetShopStatus())
    }
  }, [purchaseStatus, error, dispatch])

  // Обработка нажатия на кнопку покупки
  const handleBuyClick = (item) => {
    if (userCoins < item.price) {
      alert('Недостаточно жетонов!')
      return
    }

    // Если категория — мерч, сначала открываем модалку для ввода адреса
    if (item.category === 'merch') {
      setPendingItem(item)
      setIsModalOpen(true)
    } else {
      dispatch(fetchPurchaseItem({ itemCode: item.code }))
    }
  }

  // Колбэк подтверждения из дочерней модалки адреса
  const handleConfirmAddress = (deliveryAddress) => {
    dispatch(
      fetchPurchaseItem({
        itemCode: pendingItem.code,
        deliveryAddress,
      }),
    )
  }

  if (status === 'loading')
    return (
      <div className={styles.container}>Загрузка магазина...</div>
    )

  if (status === 'failed')
    return (
      <div className={styles.container}>
        Не удалось загрузить витрину
      </div>
    )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Магазин Жетонов</h2>
        <div className={styles.balanceBadge}>
          🪙 {userCoins} жетонов
        </div>
      </div>

      <div className={styles.grid}>
        {items.map((item) => {
          // Проверяем, куплен ли уже этот товар пользователем
          const isOwned = userInventory.some(
            (inv) => inv.itemCode === item.code,
          )

          // Исключаем утилиты и мерч из уникальных предметов, их можно брать многократно
          const isUnique =
            item.category !== 'utility' && item.category !== 'merch'
          const isBuying = purchaseStatus === 'loading'

          return (
            <div key={item.code} className={styles.card}>
              <div className={styles.iconBox}>
                {iconMap[item.icon] || '📦'}
              </div>

              <div className={styles.info}>
                <span className={styles.itemTitle}>{item.title}</span>
                <span className={styles.description}>
                  {item.description}
                </span>
              </div>

              <button
                className={styles.buyButton}
                disabled={(isUnique && isOwned) || isBuying}
                onClick={() => handleBuyClick(item)} // ИСПРАВЛЕНО: Передаем объект item целиком
              >
                {isUnique && isOwned ? 'Куплено' : `🪙 ${item.price}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Отрисовка модального окна доставки */}
      {isModalOpen && (
        <ShopAddressModal
          item={pendingItem}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmAddress}
        />
      )}
    </div>
  )
}

export default Shop
