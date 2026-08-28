import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '../redux/slices/themeSlice'
import { setThemeStorage } from './vkStorage'

const useTheme = () => { 
  const dispatch = useDispatch() 

  const theme = useSelector((state) => state.theme.userTheme)

  const toggleTheme = () => {
    //  отправляем после обработки аргумента данные редьюсера, тамже заносим данные в локалСторадж
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    dispatch(setTheme(newTheme))
    // передаю данные в хранилище ВК
    setThemeStorage(newTheme)
  }

  return {
    theme,
    toggleTheme,
  }
}

export default useTheme
