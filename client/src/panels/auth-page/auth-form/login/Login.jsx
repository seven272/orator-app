/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'

import bridge from '@vkontakte/vk-bridge' // Подключаем мост VK

import { fetchLoginUser } from '../../../../redux/slices/authSlice'
import styles from './Login.module.css'

const Login = ({ showRegister }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Хэндлер обычной авторизации по Email
  const onFinish = async (values) => {
    setLoading(true)
    try {
      await dispatch(fetchLoginUser(values)).unwrap()
      message.success('Вы успешно авторизовались!')
      setTimeout(() => {
        navigate('/') // Редирект через VK-роутер
      }, 1000)
    } catch (error) {
      message.error(error?.message || 'Ошибка при авторизации')
    } finally {
      setLoading(false)
    }
  }

  // Хэндлер авторизации через ВКонтакте на Сайте
  const handleVkLoginClick = async () => {
    try {
      // Проверяем, поддерживает ли окружение VK Bridge (если открыто в ВК или официальном WebView)
      if (bridge.isEmbedded()) {
        // Если вдруг открыли внутри ВК, но не сработал авто-вход, запрашиваем права на Email
        await bridge.send('VKWebAppInit')
        const vkData = await bridge.send('VKWebAppGetUserInfo')[2]
        alert(
          `Привет, ${vkData.first_name}! Авторизация в VK-окружении...`,
        )
        return
      }

      // СЦЕНАРИЙ ДЛЯ ОБЫЧНОГО САЙТА:
      // Перенаправляем пользователя на авторизацию VK OAuth, которая вернет его назад с параметрами
      const VK_APP_ID =
        process.env.REACT_APP_VK_APP_ID || 'ВАШ_ID_ПРИЛОЖЕНИЯ'
      const REDIRECT_URI = window.location.origin + '/' // Возвращаем на главную страницу сайта

      // Формируем ссылку. ВК вернет параметры запуска прямо в URL (в window.location.search или hash)
      window.location.href = `https://vk.com{VK_APP_ID}&redirect_uri=${REDIRECT_URI}&display=page&scope=email&response_type=token&v=5.131`
    } catch (err) {
      console.error('Ошибка VK Auth:', err)
      message.error('Не удалось связаться с ВКонтакте')
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <div className="page_form">
      <h3 className={styles.heading}>Авторизоваться</h3>
      <Form
        name="login"
        initialValues={{ remember: true }}
        style={{ maxWidth: 370 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          name="email"
          rules={[{ required: true, message: 'Введите email' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Введите пароль!' }]}
        >
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item>
          <Flex
            justify="space-between"
            align="center"
            vertical
            style={{ gap: '10px' }}
          >
            <Button
              block={true}
              type="primary"
              htmlType="submit"
              size="medium"
              className={styles.btn}
              loading={loading}
            >
              Войти
            </Button>

            {/* Разделитель "или" */}
            <div className={styles.divider}>
              <span className={styles.divider_text}>или</span>
            </div>

            {/* Кнопка ВКонтакте */}
            <button
              type="button"
              className={styles.vk_login_btn}
              onClick={handleVkLoginClick}
            >
              <span className={styles.vk_icon}>🔵</span> Войти через
              ВКонтакте
            </button>

            {/* Разделитель "или" */}
            <div className={styles.divider}>
              <span className={styles.divider_text}>или</span>
            </div>

            <a
              onClick={() => showRegister('register')}
              className={styles.link}
            >
              регистрация!
            </a>
          </Flex>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Login
