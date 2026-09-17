/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import { MdEmail, MdLock, MdCheck, MdCancel } from 'react-icons/md'

import { fetchLinkEmail } from '../../../../../redux/slices/authSlice'
import { validatePassword } from '../../../../../utils/passwordValidator'
import styles from './EmailBindRow.module.css' 

const EmailBindRow = ({ user }) => {
  const dispatch = useDispatch()
  const [emailInput, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isPasswordLinking, setIsPasswordLinking] = useState(false)

  const onFormSubmit = async (e) => {
    e.preventDefault()
    
    const targetEmail = user?.email || emailInput
    const validation = validatePassword(password, targetEmail)

    if (!validation.isValid) {
      message.error(validation.message)
      return
    }

    setIsPasswordLinking(true)
    try {
      await dispatch(
        fetchLinkEmail({
          email: targetEmail,
          password: password,
        })
      ).unwrap()

      message.success('Пароль успешно создан!')
      setShowPasswordForm(false)
      setPassword('')
      setEmailInput('')
    } catch (err) {
      if (err?.code !== 'EMAIL_ALREADY_TAKEN') {
        message.error(err?.message || 'Ошибка при создании пароля')
      }
    } finally {
      setIsPasswordLinking(false)
    }
  }

  return (
    <div className={styles.bind_section_container}>
      <div className={styles.bind_row_header}>
        <span className={styles.bind_row_title}>
          <MdEmail className={styles.row_icon} />
          Привязать email и пароль для входа через сайт
        </span>
        
        {!showPasswordForm && (
          <button
            type="button"
            className={styles.secondary_btn}
            onClick={() => setShowPasswordForm(true)}
          >
            Привязать
          </button>
        )}
      </div>
      
      {showPasswordForm && (
        <form onSubmit={onFormSubmit} className={styles.inline_email_form}>
          <div className={styles.form_field_group}>
            <label>Ваш Email:</label>
            <div className={styles.input_wrapper}>
              <input
                type="email"
                placeholder="example@mail.ru"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isPasswordLinking}
                required
              />
            </div>
          </div>
          
          <div className={styles.form_field_group}>
            <label>Придумайте пароль:</label>
            <div className={styles.input_wrapper}>
              <MdLock className={styles.input_icon} />
              <input
                type="password"
                className={styles.input_with_icon}
                placeholder="Не менее 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPasswordLinking}
                required
              />
            </div>
          </div>
          
          <div className={styles.inline_form_actions}>
            <button
              type="button"
              className={styles.cancel_btn}
              onClick={() => setShowPasswordForm(false)}
              disabled={isPasswordLinking}
            >
              <MdCancel /> Отмена
            </button>
            <button
              type="submit"
              className={styles.success_btn}
              disabled={isPasswordLinking}
            >
              <MdCheck /> {isPasswordLinking ? '...' : 'ОК'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default EmailBindRow
