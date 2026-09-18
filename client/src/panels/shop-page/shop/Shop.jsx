import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'

import {
  fetchShopItems,
  fetchPurchaseItem,
  resetShopStatus,
} from '../../../redux/slices/shopSlice'
import {
  updateCoinsAndInventory,
  fetchProfileData,
} from '../../../redux/slices/profileSlice' // Переключаемся на ваш экшен профиля
import { checkIsAuth } from '../../../redux/slices/authSlice'
import { Link } from 'react-router-dom'
import { MdArrowBackIosNew } from 'react-icons/md'

import styles from './Shop.module.css'
import ShopItemCard from './shop-item-card/ShopItemCard.jsx'
import ShopAddressModal from './shop-address-modal/ShopAddressModal.jsx'
import UserInventoryList from './user-inventory-list/UserInventoryList.jsx'

const Shop = () => {
  const dispatch = useDispatch()
  const isAuth = useSelector(checkIsAuth)

  // 🔐 Читаем данные строго из profileSlice, как вы и предложили
  const { user: profileUser } = useSelector((state) => state.profile)

  // 🪙 Исправлено: Считываем coins прямо из корня плоского объекта profileUser!
  const userCoins = profileUser?.coins || 0

  // 🎟️ Исправлено: Считываем инвентарь из корня плоского объекта profileUser!
  const userInventory = profileUser?.inventory || []

  // Получаем состояние витрины магазина
  const { items, status } = useSelector((state) => state.shop)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingItem, setPendingItem] = useState(null)

  const [buyingItemCode, setBuyingItemCode] = useState(null)

  useEffect(() => {
    dispatch(fetchShopItems())
    // Если юзер авторизован, но профиль в Redux еще пустой — догружаем строго ProfileData
    if (isAuth && !profileUser) {
      dispatch(fetchProfileData())
    }
    return () => dispatch(resetShopStatus())
  }, [dispatch, isAuth])

  const handleBuyClick = async (item) => {
   // 1. Проверяем, уникален ли товар и куплен ли он уже
  const isOwned = userInventory.some((inv) => inv.itemCode === item.code)
  const isUnique = item.category !== 'utility' && item.category !== 'merch'
  
  if (isUnique && isOwned) {
    message.info('Этот предмет уже есть в вашей коллекции!')
    return
  }

  // 2. Проверка баланса
  if (userCoins < item.price) {
    message.warning('Недостаточно жетонов оратора!')
    throw new Error('Low balance') // или просто return
  }

  // 3. Обработка мерча
  if (item.category === 'merch') {
    setPendingItem(item)
    setIsModalOpen(true)
    return
  }

  await executePurchase(item.code, null)
  }

  const executePurchase = async (itemCode, deliveryAddress) => {
    setBuyingItemCode(itemCode) // 1. Перед запросом записываем код (например, 'streak_freeze')

    try {
      // 1. Получаем ответ от бэкенда (res.data содержит { message, coins, inventory })
      const result = await dispatch(
        fetchPurchaseItem({ itemCode, deliveryAddress }),
      ).unwrap()

      // 2. 🔥 МАГИЯ МГНОВЕННОГО ОБНОВЛЕНИЯ:
      // Вручную пушим свежий инвентарь и монеты из ответа сервера в profileSlice
      dispatch(
        updateCoinsAndInventory({
          coins: result.coins,
          inventory: result.inventory,
        }),
      )

      message.success(result?.message || 'Покупка совершена успешно!')
    } catch (err) {
      message.error(err?.message || 'Ошибка')
    } finally {
      setBuyingItemCode(null) // 2. После ответа сервера сбрасываем в null
      dispatch(resetShopStatus())
    }
  }

  const handleConfirmAddress = async (deliveryAddress) => {
    setIsModalOpen(false)
    if (pendingItem) {
      try {
        await executePurchase(pendingItem.code, deliveryAddress)
      } catch (e) {
        /* ошибка обработана */
      }
      setPendingItem(null)
    }
  }

 if (status === 'loading' && items.length === 0) {
  return <div className={styles.container}>Загрузка магазина...</div>
}
  if (status === 'failed')
    return (
      <div className={styles.container}>
        Не удалось загрузить витрину
      </div>
    )

 
   const visibleItems = items.filter(
    (item) => item.category !== 'merch' && item.category !== 'theme',
  )


  return (
    <div className={styles.container}>
    <div className={styles.header}>
      {/* Верхняя линия управления: кнопка назад и баланс */}
      <div className={styles.topBar}>
        <Link to="/" className={styles.backButton}>
          <MdArrowBackIosNew className={styles.backIcon} />
          <span>На главную</span>
        </Link>
        
        <div className={styles.balanceBadge}>
          🪙 {userCoins} жетонов
        </div>
      </div>
      
      {/* Главный заголовок страницы */}
      <h2 className={styles.title}>Магазин Оратора</h2>
    </div>

      <div className={styles.grid}>
        {visibleItems.map((item) => (
          <ShopItemCard
            key={item.code}
            item={item}
            userInventory={userInventory}
            userCoins={userCoins}
            isThisItemBuying={buyingItemCode === item.code} // Включает "..." на нажатой кнопке
            onBuyClick={handleBuyClick}
          />
        ))}
      </div>

      {isAuth && profileUser?.inventory?.length > 0 && (
        <UserInventoryList
          inventory={profileUser.inventory}
          items={items}
        />
      )}

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
