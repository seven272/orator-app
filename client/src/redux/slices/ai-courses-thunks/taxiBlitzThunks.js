import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../utils/axiosInstance';

// 1. Старт тренажера
export const fetchStartTaxiBlitzTrainer = createAsyncThunk(
  'course/fetchStartTaxiBlitzTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/taxi-blitz/start',
        {
          courseCode,
          exerciseData,
        },
      );
      return res.data; // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера Такси-Блиц' },
      );
    }
  },
);

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendTaxiBlitzResponse = createAsyncThunk(
  'course/fetchSendTaxiBlitzResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('courseCode', courseCode);
      formData.append('file', audioBlob, 'taxi_speech.wav');

      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/taxi-blitz/respond',
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
        error.response?.data?.message || 'Ошибка отправки ответа водителю',
      );
    }
  },
);

// 3. Завершение тренажера и получение аналитики
export const fetchFinishTaxiBlitzTrainer = createAsyncThunk(
  'course/fetchFinishTaxiBlitzTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/taxi-blitz/finish',
        { courseCode },
      );
      return res.data; // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации тренажера Такси-Блиц' },
      );
    }
  },
);
