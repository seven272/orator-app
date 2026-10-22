import React from 'react'
import styles from './Spinner.module.css'

const Spinner = ({
  size = 'md',
  variant = 'primary',
  centered = false,
  className = '',
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    className,
  ]
    .join(' ')
    .trim()

  // Если передан проп centered, оборачиваем в центрирующий контейнер
  const wrapperClasses = centered
    ? `${styles.spinner_wrapper} ${styles.centered_full}`
    : styles.spinner_wrapper

  return (
    <div
      className={wrapperClasses}
      role="status"
      aria-label="Загрузка"
    >
      <div className={spinnerClasses}></div>
    </div>
  )
}

export default Spinner
