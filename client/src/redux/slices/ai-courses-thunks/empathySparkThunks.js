import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../utils/axiosInstance';

// 1. Старт тренажера
export const fetchStartEmpathySparkTrainer = createAsyncThunk(
  'course/fetchStartEmpathySparkTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    console.log(courseCode)
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/empathy-spark/start',
        {
          courseCode,
          exerciseData,
        },
      );
      return res.data; // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера Искра доверия' },
      );
    }
  },
);

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendEmpathySparkResponse = createAsyncThunk(
  'course/fetchSendEmpathySparkResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('courseCode', courseCode);
      formData.append('file', audioBlob, 'empathy_speech.wav');

      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/empathy-spark/respond',
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
        error.response?.data?.message || 'Ошибка отправки ответа попутчику',
      );
    }
  },
);

// 3. Завершение тренажера и получение аналитики
export const fetchFinishEmpathySparkTrainer = createAsyncThunk(
  'course/fetchFinishEmpathySparkTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/compliment-pro/empathy-spark/finish',
        { courseCode },
      );
      return res.data; // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации тренажера Искра доверия' },
      );
    }
  },
);
