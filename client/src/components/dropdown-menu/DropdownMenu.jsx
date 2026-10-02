import { Dropdown, Space } from 'antd'
import { TfiMenu } from 'react-icons/tfi'
import { FaRegHandPointRight } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

import styles from './DropdownMenu.module.css'

const DropdownMenu = () => {
  const navigate = useNavigate()

  const arrData = [
    {
      title: 'главная',
      alias: 'main',
    },
    {
      title: 'статистика',
      alias: 'dashboard',
    },
    {
      title: 'тренажеры',
      alias: 'exercises-all',
    },
    {
      title: 'курсы',
      alias: 'courses',
    },
    {
      title: 'живая дуэль',
      alias: 'live-duel',
    },
    {
      title: 'рейтинг и лента',
      alias: 'community',
    },
    {
      title: 'испытания',
      alias: 'challenges',
    },
    {
      title: 'магазин',
      alias: 'shop',
    },
  ]

  const handleMenuClick = (payload) => {
    const { key } = payload
    const categories = [
      '/',
      'shop',
      'exercises-all',
      'community',
      'challenges',
      'live-duel',
      'courses',
      'dashboard',
    ]

    if (categories.includes(key)) {
      // Используем replace, чтобы не плодить историю при переходах между категориями
      navigate(`/${key}`, { replace: true })
    } else {
      navigate('/')
    }
  }

  const objectStyles = {
    root: {
      backgroundColor: '#ffffff',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
    },
    item: {
      padding: '8px 12px',
      fontSize: '16px',
    },
    itemTitle: {
      fontWeight: '500',
    },
    itemIcon: {
      color: `#007aff`,
      marginRight: '5px',
    },
    itemContent: {
      backgroundColor: 'transparent',
    },
  }

  const items = arrData.map((elem) => {
    return {
      label: elem.title,
      key: elem.alias,
      icon: <FaRegHandPointRight />,
    }
  })

  const menuProps = {
    items,
    onClick: handleMenuClick,
  }

  return (
    <Dropdown
      menu={menuProps}
      className={styles.menu}
      styles={objectStyles}
    >
      <Space align="center" orientation="horizontal">
        <TfiMenu className={styles.icon} />
      </Space>
    </Dropdown>
  )
}

export default DropdownMenu
