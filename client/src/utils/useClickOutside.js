import { useEffect } from 'react'

//передаем два аргумента html элемент, который сохраняем в компонете черех хук useRef и коллбэк для закрытия выпдающего списка () => someFn()

const useClickOutside = (ref, callback) => {
  useEffect(() => {
    const handleClick = (evt) => {
      //проверем что дом элемент есть и что клик был сделан вне его области
      if (ref.current && !ref.current.contains(evt.target)) {
        callback()
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () =>
      document.removeEventListener('mousedown', handleClick)
  }, [])
}

export default useClickOutside
