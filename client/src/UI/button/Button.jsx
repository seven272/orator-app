import React from 'react'
import styles from './Button.module.css'

const Button = ({
  classBtn,
  clickBtn,
  disabledBtn = false,
  children,
}) => { 
  return (
    <button
      className={`${styles[classBtn]}`}
      onClick={clickBtn} 
      disabled={disabledBtn}
    >
      {children}
    </button>
  )
}

export default Button
