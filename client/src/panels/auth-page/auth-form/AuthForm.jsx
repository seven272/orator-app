import { useState, useEffect } from 'react'
import { IoMdClose } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'

import Login from './login/Login'
import Register from './register/Register'
import styles from './AuthForm.module.css'

const AuthForm = () => {
  const navigate = useNavigate()
  const [showComponent, setShowComponent] = useState('login')
  const [closeForm, setCloseForm] = useState(false)

  useEffect(() => {
    if (closeForm) {
      navigate('/')
    }
  }, [closeForm, navigate])

  return (
    <div className={styles.section}>
      <IoMdClose
        size={30}
        className={styles.icon_close}
        onClick={() => setCloseForm(true)}
      />
      {showComponent === 'login' && (
        <Login showRegister={setShowComponent} />
      )}
      {showComponent === 'register' && (
        <Register showLogin={setShowComponent} />
      )}
    </div>
  )
}

export default AuthForm
