// ShopAddressModal.jsx
import React, { useState } from 'react'
import styles from './ShopAddressModal.module.css' // Используем те же стили для сохранения анимаций

const ShopAddressModal = ({ item, onClose, onConfirm }) => {
  const [address_text, setAddressText] = useState('')

  const handleSend = () => {
    if (!address_text.trim()) {
      alert('Пожалуйста, заполните данные для доставки!')
      return
    }
    // Передаем введенный адрес в родительский компонент
    onConfirm(address_text)
  }

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modal_title}>Оформление доставки</h3>
        <p className={styles.modal_hint}>Товар: {item?.title}</p>
        
        <textarea 
          className={styles.address_textarea}
          placeholder="Введите ФИО, телефон и полный адрес доставки (город, улица, дом, кв, индекс или ПВЗ СДЭК)..."
          value={address_text}
          onChange={(e) => setAddressText(e.target.value)}
        />

        <div className={styles.modal_actions}>
          <button className={styles.btn_cancel} onClick={onClose}>
            Отмена
          </button>
          <button className={styles.btn_confirm} onClick={handleSend}>
            Заказать
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShopAddressModal
