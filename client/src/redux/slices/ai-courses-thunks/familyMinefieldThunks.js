import { createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../../utils/axiosInstance';

// 1. Старт тренажера
export const fetchStartFamilyMinefieldTrainer = createAsyncThunk(
  'course/fetchStartFamilyMinefieldTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/family-minefield/start',
        {
          courseCode,
          exerciseData,
        },
      );
      return res.data; // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера Семейное минное поле' },
      );
    }
  },
);

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendFamilyMinefieldResponse = createAsyncThunk(
  'course/fetchSendFamilyMinefieldResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('courseCode', courseCode);
      formData.append('file', audioBlob, 'family_speech.wav');

      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/family-minefield/respond',
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
        error.response?.data?.message || 'Ошибка отправки ответа родственнику',
      );
    }
  },
);

// 3. Завершение тренажера и получение аналитики
export const fetchFinishFamilyMinefieldTrainer = createAsyncThunk(
  'course/fetchFinishFamilyMinefieldTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/qa-master/family-minefield/finish',
        { courseCode },
      );
      return res.data; // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации тренажера Семейное минное поле' },
      );
    }
  },
);
