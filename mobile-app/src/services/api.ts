/**
 * API Service
 * Handles all API calls to backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          await this.refreshToken();
          // Retry original request
          return this.client.request(error.config!);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken } = response.data.data.tokens;
      await SecureStore.setItemAsync('accessToken', accessToken);
    } catch (error) {
      // Refresh failed, clear tokens and redirect to login
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      throw error;
    }
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    const { tokens, user } = response.data.data;
    
    // Store tokens securely
    await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    
    return { user, tokens };
  }

  async logout() {
    await this.client.post('/auth/logout');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data.data.user;
  }

  // Patient endpoints
  async createPatient(data: {
    name: string;
    age: number;
    gender?: string;
    village?: string;
    district?: string;
    state?: string;
  }) {
    const response = await this.client.post('/patients', data);
    return response.data.data.patient;
  }

  async getPatients(page = 1, limit = 20, search?: string) {
    const response = await this.client.get('/patients', {
      params: { page, limit, search },
    });
    return response.data.data;
  }

  async getPatient(id: string) {
    const response = await this.client.get(`/patients/${id}`);
    return response.data.data.patient;
  }

  async getPatientHistory(id: string) {
    const response = await this.client.get(`/patients/${id}/history`);
    return response.data.data.history;
  }

  // Recording endpoints
  async uploadRecording(
    audioUri: string,
    patientId: string,
    recordingType: string,
    metadata: {
      duration?: number;
      qualityScore?: number;
    }
  ) {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'recording.wav',
    } as any);
    formData.append('patient_id', patientId);
    formData.append('recording_type', recordingType);
    if (metadata.duration) {
      formData.append('duration_seconds', metadata.duration.toString());
    }
    if (metadata.qualityScore) {
      formData.append('quality_score', metadata.qualityScore.toString());
    }

    const response = await this.client.post('/recordings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.recording;
  }

  async getRecordings(patientId?: string, page = 1, limit = 20) {
    const response = await this.client.get('/recordings', {
      params: { patient_id: patientId, page, limit },
    });
    return response.data.data;
  }

  async triggerAnalysis(recordingId: string) {
    const response = await this.client.post(`/recordings/${recordingId}/analyze`);
    return response.data.data;
  }

  // Analysis endpoints
  async getAnalysisResults(recordingId: string) {
    const response = await this.client.get(`/analysis/${recordingId}/results`);
    return response.data.data.analysis;
  }

  async getJobStatus(jobId: string) {
    const response = await this.client.get(`/analysis/${jobId}`);
    return response.data.data;
  }

  // Report endpoints
  async getReport(analysisId: string) {
    const response = await this.client.get(`/reports/${analysisId}`);
    return response.data.data.report;
  }

  async generatePDF(analysisId: string) {
    const response = await this.client.get(`/reports/${analysisId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new ApiService();

