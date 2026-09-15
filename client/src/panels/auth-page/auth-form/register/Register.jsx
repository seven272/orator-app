/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheckSquare,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa' // Иконки нативного пака

import { fetchRegisterUser } from '../../../../redux/slices/authSlice'
import { validatePassword } from '../../../../utils/passwordValidator'
import styles from './Register.module.css'

const questions = [
  {
    question: 'Сколько гласных букв в слове "Голос" (укажите число)?',
    questionIndex: 0,
  },
  {
    question: 'Противоположность слову "Громко" (наречие, 4 буквы)?',
    questionIndex: 1,
  },
  { question: '2 + 3 * 3 = ?', questionIndex: 2 },
]

const Register = ({ showLogin }) => {
  const dispatch = useDispatch()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [botAnswer, setBotAnswer] = useState('')

  const [randomQuestion] = useState(
    () => questions[Math.floor(Math.random() * questions.length)],
  )
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [emailError, setEmailError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    text: '',
    color: '#e2dcdc',
  })

  const handleEmailBlur = (val) => {
    if (!val.trim()) {
      setEmailError('Укажите вашу почту')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailError(
      emailRegex.test(val.trim()) ? '' : 'Некорректный формат email',
    )
  }

  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, text: '', color: '#e2dcdc' })
      return
    }
    const result = validatePassword(password, email)
    if (!result.isValid) {
      setPasswordStrength({
        score: 1,
        text: result.message,
        color: 'var(--color-red)',
      })
    } else if (
      password.length >= 10 &&
      /[0-9]/.test(password) &&
      /[a-zA-Z]/.test(password)
    ) {
      setPasswordStrength({
        score: 3,
        text: 'Надежный пароль',
        color: 'var(--color-green)',
      })
    } else {
      setPasswordStrength({
        score: 2,
        text: 'Простой пароль',
        color: 'var(--color-yellow)',
      })
    }
  }, [password, email])

  const handleSubmit = async (evt) => {
    evt.preventDefault()

    if (!email.trim() || emailError) {
      message.error('Укажите корректный Email')
      return
    }

    const passwordCheck = validatePassword(password, email)
    if (!passwordCheck.isValid) {
      message.error(passwordCheck.message)
      return
    }

    if (!botAnswer.trim()) {
      message.error('Ответьте на проверочный вопрос!')
      return
    }

    setLoading(true)
    try {
      await dispatch(
        fetchRegisterUser({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          botAnswer: botAnswer.trim(),
          questionIndex: randomQuestion.questionIndex,
        }),
      ).unwrap()
      message.success('Регистрация прошла успешно!')
    } catch (error) {
      message.error(error || 'Ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page_form">
      <h3 className={styles.heading}>Зарегистрироваться</h3>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 370, width: '100%' }}
      >
           {/* Имя */}
        <div className={styles.input_group}>
          <div className={styles.input_wrapper}>
            <FaUser className={styles.input_icon} />
            <input
              type="text"
              placeholder="Nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={styles.native_input}
            />
          </div>
        </div>
        {/* Email */}
        <div className={styles.input_group}>
          <div
            className={`${styles.input_wrapper} ${emailError ? styles.input_invalid : ''}`}
          >
            <FaEnvelope className={styles.input_icon} />
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleEmailBlur(e.target.value)}
              className={styles.native_input}
            />
          </div>
          {emailError && (
            <span className={styles.error_text}>{emailError}</span>
          )}
        </div>

        {/* Пароль */}
        <div className={styles.input_group}>
          <div className={styles.input_wrapper}>
            <FaLock className={styles.input_icon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.native_input}
            />
            <button
              type="button"
              className={styles.eye_btn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {/* Индикатор силы */}
          {password && (
            <div className={styles.strength_meter}>
              <div
                className={styles.strength_bar}
                style={{
                  width: `${(passwordStrength.score / 3) * 100}%`,
                  backgroundColor: passwordStrength.color,
                }}
              />
              <span
                className={styles.strength_text}
                style={{ color: passwordStrength.color }}
              >
                {passwordStrength.text}
              </span>
            </div>
          )}
        </div>

     

        {/* Капча-облачко */}
        <div className={styles.captcha_cloud_container}>
          <div className={styles.speech_bubble}>
            {randomQuestion.question}
          </div>
          <div
            className={styles.input_wrapper}
            style={{ marginTop: '10px' }}
          >
            <FaCheckSquare className={styles.input_icon} />
            <input
              type="text"
              placeholder="Your answer"
              value={botAnswer}
              onChange={(e) => setBotAnswer(e.target.value)}
              className={styles.native_input}
            />
          </div>
        </div>

        <div className={styles.action_flex}>
          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
          <a
            onClick={() => showLogin('login')}
            className={styles.link}
          >
            авторизация!
          </a>
        </div>
      </form>
    </div>
  )
}

export default Register
