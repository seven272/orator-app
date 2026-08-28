import bridge from '@vkontakte/vk-bridge'
import { useDispatch } from 'react-redux'
import {
  setVkUser,
  fetchCheckVkUser,
} from '../redux/slices/vkUserSlice'

const useVkUser = () => {
  const dispatch = useDispatch()

  const getUserInfo = async () => {
    try {
      const data = await bridge.send('VKWebAppGetUserInfo')
       // Данные пользователя получены
      if (data.id) {
        dispatch(setVkUser(data))
        dispatch(fetchCheckVkUser(data.id))
      }
    } catch (error) {
      console.log('Ошибка при загрузке данных о пользователе ВК')
      console.log(error)
    }
  }
  return {
    getUserInfo,
  }
}
export { useVkUser }
