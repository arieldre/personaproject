import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  validateInvite: (token) => api.get(`/auth/invite/${token}`),
};

// Companies API
export const companiesAPI = {
  list: (params) => api.get('/companies', { params }),
  create: (data) => api.post('/companies', data),
  createOwn: (data) => api.post('/companies/create-own', data),
  get: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  updateLicenses: (id, data) => api.put(`/companies/${id}/licenses`, data),
  getUsers: (id, params) => api.get(`/companies/${id}/users`, { params }),
  getStats: (id) => api.get(`/companies/${id}/stats`),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Users API
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  invite: (data) => api.post('/users/invite', data),
  getInvitations: (params) => api.get('/users/invitations', { params }),
  revokeInvitation: (id) => api.delete(`/users/invitations/${id}`),
};

// Questionnaires API
export const questionnairesAPI = {
  getTemplates: () => api.get('/questionnaires/templates'),
  getTemplate: (id) => api.get(`/questionnaires/templates/${id}`),
  list: (params) => api.get('/questionnaires', { params }),
  create: (data) => api.post('/questionnaires', data),
  get: (id) => api.get(`/questionnaires/${id}`),
  update: (id, data) => api.put(`/questionnaires/${id}`, data),
  delete: (id) => api.delete(`/questionnaires/${id}`),
  getByAccessCode: (code) => api.get(`/questionnaires/access/${code}`),
  submitResponse: (id, data) => api.post(`/questionnaires/${id}/responses`, data),
  getResponses: (id, params) => api.get(`/questionnaires/${id}/responses`, { params }),
  previewClusters: (id, data) => api.post(`/questionnaires/${id}/preview-clusters`, data),
  generatePersonas: (id, data) => api.post(`/questionnaires/${id}/generate-personas`, data),
  deletePersonas: (id) => api.delete(`/questionnaires/${id}/personas`),
};

// Personas API
export const personasAPI = {
  list: (params) => api.get('/personas', { params }),
  get: (id) => api.get(`/personas/${id}`),
  update: (id, data) => api.put(`/personas/${id}`, data),
  delete: (id) => api.delete(`/personas/${id}`),
  findSimilar: (data) => api.post('/personas/find-similar', data),
  getEngagementStats: () => api.get('/personas/engagement-stats'),
  getDefaults: () => api.get('/personas/defaults'),
  // Conversations
  getConversations: (personaId) => api.get(`/personas/${personaId}/conversations`),
  createConversation: (personaId, data) => api.post(`/personas/${personaId}/conversations`, data),
  getConversation: (conversationId) => api.get(`/personas/conversations/${conversationId}`),
  sendMessage: (conversationId, content, options = {}) => api.post(`/personas/conversations/${conversationId}/messages`, { content, ...options }),
  saveConversation: (conversationId, data) => api.put(`/personas/conversations/${conversationId}/save`, data),
  deleteConversation: (conversationId) => api.delete(`/personas/conversations/${conversationId}`),
};

// Training API
export const trainingAPI = {
  getScenarios: () => api.get('/training/scenarios'),
  getScenario: (id) => api.get(`/training/scenarios/${id}`),
  startSession: (data) => api.post('/training/sessions', data),
  sendMessage: (sessionId, content) => api.post(`/training/sessions/${sessionId}/message`, { content }),
  gradeSession: (data) => api.post('/training/grade', data),
  getHistory: () => api.get('/training/sessions'),
};

export default api;
