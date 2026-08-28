import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../utils/axiosInstance';

// 1. Старт тренажера
export const fetchStartAntiFlatteryTrainer = createAsyncThunk(
  'course/fetchStartAntiFlatteryTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/anti-flattery/start',
        {
          courseCode,
          exerciseData,
        },
      );
      return res.data; // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера Тонкая грань' },
      );
    }
  },
);

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendAntiFlatteryResponse = createAsyncThunk(
  'course/fetchSendAntiFlatteryResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('courseCode', courseCode);
      formData.append('file', audioBlob, 'anti_flattery_speech.wav');

      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/anti-flattery/respond',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return res.data; // { user_transcript, answer, isPitchFinished }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки ответа другу',
      );
    }
  },
);

// 3. Завершение тренажера и получение аналитики
export const fetchFinishAntiFlatteryTrainer = createAsyncThunk(
  'course/fetchFinishAntiFlatteryTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/anti-flattery/finish',
        { courseCode },
      );
      return res.data; // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации тренажера Тонкая грань' },
      );
    }
  },
);
