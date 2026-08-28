import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import {
  fetchJoinLiveRoom,
  fetchGetCalendarRooms,
  fetchGetMyActiveSlots,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelSlotsList.module.css'
import MyPendingSlotCard from './type-slot/MyPendingSlotCard'
import AcceptedSlotCard from './type-slot/AcceptedSlotCard'
import AvailableSlotCard from './type-slot/AvailableSlotCard'

const LiveDuelSlotsList = () => {
  const dispatch = useDispatch()
  const { calendarRooms = [], myActiveSlots = [] } = useSelector(
    (state) => state.liveDuel,
  )
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchGetCalendarRooms())
    dispatch(fetchGetMyActiveSlots())
  }, [dispatch])

  const handleBookSlot = (roomId) => {
    dispatch(fetchJoinLiveRoom({ roomId }))
      .unwrap()
      .then(() => {
        message.success(
          'Вы успешно записались на дуэль! Ожидайте начала в назначенное время.',
        )
      })
      .catch((err) => message.error(`Не удалось записаться: ${err}`))
  }

  const allRoomsMap = new Map()
  calendarRooms.forEach((room) => allRoomsMap.set(room._id, room))
  myActiveSlots.forEach((room) => allRoomsMap.set(room._id, room))

  // Сортировка с учетом измененного ключа scheduledAt
  const combinedSlots = Array.from(allRoomsMap.values()).sort(
    (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt),
  )

  if (combinedSlots.length === 0) {
    return (
      <div className={styles.available_slots_section}>
        <h3 className={styles.slots_title}>
          Доступные запланированные дуэли:
        </h3>
        <p className={styles.no_slots_text}>
          Пока нет активных заявок. Станьте первым, предложив свое
          время в форме выше!
        </p>
      </div>
    )
  }

  return (
    <div className={styles.available_slots_section}>
      <h3 className={styles.slots_title}>Расписание дуэлей:</h3>
      <div className={styles.slots_list}>
        {combinedSlots.map((room) => {
          // Проверки адаптированы под новые ключи userA и userB
          const isMyOwnSlot =
            room.userA?._id === user._id || room.userA === user._id
          const isAccepted = room.status === 'active' || !!room.userB

          if (isAccepted) {
            return (
              <AcceptedSlotCard
                key={room._id}
                room={room}
                isMyOwnSlot={isMyOwnSlot}
                currentUserId={user._id}
              />
            )
          }

          if (isMyOwnSlot) {
            return <MyPendingSlotCard key={room._id} room={room} />
          }

          return (
            <AvailableSlotCard
              key={room._id}
              room={room}
              onBookSlot={handleBookSlot}
            />
          )
        })}
      </div>
    </div>
  )
}

export default LiveDuelSlotsList
