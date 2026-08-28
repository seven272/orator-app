/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
 
const useInput = (initialValue) => {
  const [value, setValue] = useState(initialValue)
  // определяем было ли действие в инпуте, то есть кликали на него
  const [isDirty, setDirty] = useState(false)
  const [textError, setTextError] = useState('')
  const [isValid, setValid] = useState(false)
  //регулярка только цифры
  const regNumber = /^\d+$/
  //регулярка только буквы и пробелы
  // const reg1 = /^[A-Za-z\s]+$/g
  //регулярка цифры, знаки, буквы и пробелы
  // const reg = /^[-/'"№., 0-9a-zA-Zа-яёА-ЯЁ\s]+$/g

  const onChange = (val) => {
    setValue(val)
  }

  //Событие blur вызывается когда элемент теряет фокус.
  const onBlur = (val) => {
    setDirty(true)
    if (val.length === 0) {
      setTextError('Поле не может быть пустым')
    }
  }

//проверяем длину и то, что введены цифры
  useEffect(() => {
    if (value.length > 3) {
      setTextError('Максимальная длина 3 символа')
    } else if (
      !regNumber.test(String(value).toLocaleLowerCase()) &&
      value.length !== 0
    ) {
      setTextError('Вводите только цифры')
    } else {
      setTextError('')
    }

  }, [ value])

  useEffect(() => {
    if (textError === '') {
      setValid(true)
    } else { 
      setValid(false)
    }
  }, [textError])

  return {
    onChange,
    onBlur,
    isDirty,
    textError,
    isValid,
  } 
}

const useInputPace = (initialValue) => {
  const [value, setValue] = useState(initialValue)
  const [textError, setTextError] = useState('')
  const [isValid, setValid] = useState(false)
  //регулярка только цифры
  const regNumber = /^\d+$/
 
  const onChange = (val) => {
    setValue(val)
  }

//проверяем длину и то, что введены цифры
  useEffect(() => {
    if (value.length > 2) {
      setTextError('Максимальная длина 2 символа')
    } else if (
      !regNumber.test(String(value).toLocaleLowerCase()) &&
      value.length !== 0
    ) {
      setTextError('Вводите только цифры')
    } else if (
      value > 60
    ) {
      setTextError('вводимое значение не может быть больше 60')
    } else {
      setTextError('')
    }

  }, [ value])

  useEffect(() => {
    if (textError === '') {
      setValid(true)
    } else { 
      setValid(false)
    }
  }, [textError])

  return {
    onChange,
    textError,
    isValid,
  } 
}

const useInputTime = (initialValue) => {
  const [value, setValue] = useState(initialValue)
  const [textError, setTextError] = useState('')
  const [isValid, setValid] = useState(false)
  //регулярка только цифры
  const regNumber = /^\d+$/
 
  const onChange = (val) => {
    setValue(val)
  }

//проверяем длину и то, что введены цифры
  useEffect(() => {
    if (value.length > 2) {
      setTextError('Максимальная длина 2 символа')
    } else if (
      !regNumber.test(String(value).toLocaleLowerCase()) &&
      value.length !== 0
    ) {
      setTextError('Вводите только цифры')
    } else if (
      value > 60
    ) {
      setTextError('вводимое значение не может быть больше 60')
    } else {
      setTextError('')
    }

  }, [ value])

  useEffect(() => {
    if (textError === '') {
      setValid(true)
    } else { 
      setValid(false)
    }
  }, [textError])

  return {
    onChange,
    textError,
    isValid,
  } 
}

const useInputDistance = (initialValue) => {
  const [value, setValue] = useState(initialValue)
  const [textError, setTextError] = useState('')
  const [isValid, setValid] = useState(false)
  //регулярка только цифры
  const regNumber = /^\d+$/
 
  const onChange = (val) => {
    setValue(val)
  }

//проверяем длину и то, что введены цифры
  useEffect(() => {
    if (value.length > 3) {
      setTextError('Максимальная длина 3 символа')
    } else if (
      !regNumber.test(String(value).toLocaleLowerCase()) &&
      value.length !== 0
    ) {
      setTextError('Вводите только цифры')
    } else if (
      value > 999
    ) {
      setTextError('вводимое значение не может быть больше 999')
    } else {
      setTextError('')
    }

  }, [ value])

  useEffect(() => {
    if (textError === '') {
      setValid(true)
    } else { 
      setValid(false)
    }
  }, [textError])

  return {
    onChange,
    textError,
    isValid,
  } 
}

export { useInput, useInputPace, useInputTime, useInputDistance}
