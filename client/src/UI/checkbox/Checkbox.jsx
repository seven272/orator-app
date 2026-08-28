import React, { useState } from 'react'

import styles from './Checkbox.module.css'

const Checkbox = ({ label = '', value, isDisabled = false, id, changed }) => {
  // устанавливаем возможность задать выбранный инпут или нет при встраивании в какой-то компонет, затем это устанвливаем как значение по умолчанию
  const defaultChecked = value ? true : false
  // создаем стейт для превращиние чекбокса в управляемый инпут
  const [isChecked, setIsChecked] = useState(defaultChecked)

  const handleCheckbox = () => {
    setIsChecked((prev) => !prev)
    changed()
  }

  return (
    <div className={styles.checkbox_wrapper}>
      <label className={styles.checkbox_label}>
        <input 
          type="checkbox" 
          className={isChecked ? styles.checked : ''}
          checked={value}
          onChange={handleCheckbox}
          disabled={isDisabled}
        />
        <span>{label}</span>
      </label>
    </div>
  )
}

export default Checkbox
