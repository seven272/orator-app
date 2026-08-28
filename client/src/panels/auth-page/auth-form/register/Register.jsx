/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Flex, Form, Input, Typography, message } from 'antd'
import {
  LockOutlined,
  UserOutlined,
  CheckSquareOutlined,
  MailOutlined,
} from '@ant-design/icons'

import { fetchRegisterUser } from '../../../../redux/slices/authSlice'
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

  const [randomQuestion] = useState(
    () => questions[Math.floor(Math.random() * questions.length)],
  )
  const [loading, setLoading] = useState(false)
  const { Text } = Typography

  const onFinish = async (values) => {
    try {
      await dispatch(fetchRegisterUser(values)).unwrap()
      message.success('Регистрация прошла успешно!')
    } catch (error) {
      message.error(error?.message || 'Ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  }

  return (
    <div className="page_form">
      <h3 className={styles.heading}>Зарегистрироваться</h3>
      <Form
        name="register"
        // Устанавливаем начальное значение для скрытого поля индекса
        initialValues={{
          remember: true,
          questionIndex: randomQuestion.questionIndex,
        }}
        style={{ maxWidth: 370 }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        {/* Скрытое поле для передачи индекса вопроса */}
        <Form.Item name="questionIndex" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: 'Укажите вашу почту',
            },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            type="email"
            placeholder="Email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            {
              required: true,
              message: 'Укажите ваш пароль!',
            },
          ]}
        >
          <Input
            prefix={<LockOutlined />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>

        <Form.Item
          name="displayName"
          rules={[
            {
              required: false,
              message: 'Укажите ваше имя',
            },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="Name" />
        </Form.Item>
        <Text type="secondary" style={{ marginBottom: '5px' }}>
          {randomQuestion.question}
        </Text>
        <Form.Item
          name="botAnswer"
          rules={[
            {
              required: true,
              message: 'Ответьте на вопрос!',
            },
          ]}
        >
          <Input
            prefix={<CheckSquareOutlined />}
            placeholder="Your answer"
          />
        </Form.Item>

        <Form.Item>
          <Flex justify="space-between" align="center" vertical>
            <Button
              block={true}
              className={styles.btn}
              type="primary"
              loading={loading}
              htmlType="submit"
              size="medium"
            >
              Отправить
            </Button>
            <a
              onClick={() => showLogin('login')}
              className={styles.link}
            >
              авторизация!
            </a>
          </Flex>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Register
