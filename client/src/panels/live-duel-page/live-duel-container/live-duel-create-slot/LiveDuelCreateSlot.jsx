import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import MyActiveSlot from './my-active-slot/MyActiveSlot'
import styles from './LiveDuelCreateSlot.module.css'
import {
  fetchCreateLiveRoom,
  fetchGetCalendarRooms,
  fetchGetMyActiveSlots,
  fetchUpdateLiveRoomDate,
  fetchDeleteLiveRoom,
} from '../../../../redux/slices/liveDuelSlice'

const LiveDuelCreateSlot = () => {
  const dispatch = useDispatch()
  const { myActiveSlots = [] } = useSelector(
    (state) => state.liveDuel,
  )
  const [selectedDate, setSelectedDate] = useState('')

  // Фильтруем только те слоты, которые находятся в ожидании (pending)
  // Это важно, так как принятые матчи (active) не должны учитываться в лимите создания новых
  const pendingSlots = myActiveSlots.filter(
    (room) => room.status === 'pending',
  )

  useEffect(() => {
    dispatch(fetchGetMyActiveSlots())
  }, [dispatch])

  const handleSubmitSlot = async (evt) => {
    evt.preventDefault()
    if (!selectedDate) return
    try {
      await dispatch(
        fetchCreateLiveRoom({
          creationType: 'calendar',
          scheduledAt: selectedDate,
        }),
      ).unwrap()
      message.success(
        'Ваш слот на дуэль успешно создан, он появится в общем списке!',
      )
      // Обновляем локально списки
      dispatch(fetchGetMyActiveSlots())
      dispatch(fetchGetCalendarRooms())
      setSelectedDate('')
    } catch (err) {
      message.error(err || 'Произошла ошибка при создании слота.')
    }
  }

  const handleUpdateSlot = async (roomId, newDate) => {
    try {
      await dispatch(
        fetchUpdateLiveRoomDate({ roomId, scheduledAt: newDate }),
      ).unwrap()
      message.success('Дата слота успешно изменена!')
      dispatch(fetchGetCalendarRooms()) // Синхронизируем глобальную ленту
    } catch (err) {
      message.error(err || 'Не удалось обновить слот')
    }
  }

  const handleCancelSlot = async (roomId) => {
    try {
      await dispatch(fetchDeleteLiveRoom({ roomId })).unwrap()
      message.success('Слот успешно удален!')
       dispatch(fetchGetMyActiveSlots()) 
      dispatch(fetchGetCalendarRooms())
    } catch (err) {
      message.error(err || 'Не удалось удалить слот')
    }
  }

  

  return (
    <div className={styles.calendar_section}>
      {/* Форма создания слота */}
      <form
        className={styles.calendar_box}
        onSubmit={handleSubmitSlot}
      >
        <label className={styles.calendar_label}>
          Предложить свое время для дуэли (Лимит: максимум 3 слота):
        </label>
        <div className={styles.input_group}>
          <input
            type="datetime-local"
            className={styles.calendar_input}
            value={selectedDate}
            onChange={(evt) => setSelectedDate(evt.target.value)}
            required
            disabled={pendingSlots.length >= 3}
          />
          <button
            type="submit"
            className={styles.calendar_submit_btn}
            disabled={pendingSlots.length >= 3}
          >
            Опубликовать слот
          </button>
        </div>
        {pendingSlots.length >= 3 && (
          <p className={styles.limit_warning}>
            Вы исчерпали лимит активных слотов (макс. 3)
          </p>
        )}
      </form>

      {/* Список Своих Созданных Слотов */}
      <div className={styles.my_slots_section}>
        <h3 className={styles.slots_title}>
          Ваши активные слоты ({pendingSlots.length}/3):
        </h3>
        {pendingSlots.length === 0 ? (
          <p className={styles.no_slots_text}>
            У вас пока нет созданных активных слотов.
          </p>
        ) : (
          <div className={styles.slots_list}>
            {pendingSlots.map((room) => (
              <MyActiveSlot
                key={room._id}
                room={room}
                onDeleteSlot={handleCancelSlot}
                onUpdateSlot={handleUpdateSlot}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LiveDuelCreateSlot
