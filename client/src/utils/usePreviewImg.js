import { useState } from 'react'

const usePreviewImg = () => {
  const [imgUrl, setImgUrl] = useState(null)
  const handleImageChange = (evt) => {
    const file = evt.target.files[0]
    //проверка на тип файла, начинается ли строка с ...
    if (file && (file.type.startsWith('image/') || file.type.startsWith('application/pdf'))) {
      const reader = new FileReader()
      //loadend – срабатывает, когда объект завершил передачу данных. Всегда срабатывает после error, abort или load.
      reader.onloadend = () => {
        setImgUrl(reader.result)
      }
      //считать данные как base64-кодированный URL
      reader.readAsDataURL(file)
    } else {
      console.log('ошибка при загрузке файла. Хук usePrewiewImg')
      setImgUrl(null)
    }
  }
  return { handleImageChange, imgUrl, setImgUrl }
}

export default usePreviewImg