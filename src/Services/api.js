import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/?api\/?$/, '');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    if (response.data.tokens) {
      localStorage.setItem('access_token', response.data.tokens.access);
      localStorage.setItem('refresh_token', response.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  updateProfile: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    const response = await api.put('/auth/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
};

// Courses API
export const coursesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/courses/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/courses/${id}/`);
    return response.data;
  },

  create: async (courseData) => {
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });
    const response = await api.post('/courses/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id, courseData) => {
    const formData = new FormData();
    Object.keys(courseData).forEach((key) => {
      if (courseData[key] !== null && courseData[key] !== undefined) {
        formData.append(key, courseData[key]);
      }
    });
    const response = await api.put(`/courses/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  patch: async (id, courseData) => {
    const response = await api.patch(`/courses/${id}/`, courseData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/courses/${id}/`);
    return response.data;
  },

  enroll: async (id) => {
    const response = await api.post(`/courses/${id}/enroll/`);
    return response.data;
  },

  addToWishlist: async (id) => {
    const response = await api.post(`/courses/${id}/add_to_wishlist/`);
    return response.data;
  },

  removeFromWishlist: async (id) => {
    const response = await api.delete(`/courses/${id}/remove_from_wishlist/`);
    return response.data;
  },
};

export const modulesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/modules/', { params });
    return response.data;
  },
  create: async (moduleData) => {
    const response = await api.post('/modules/', moduleData);
    return response.data;
  },
  update: async (id, moduleData) => {
    const response = await api.put(`/modules/${id}/`, moduleData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/modules/${id}/`);
    return response.data;
  },
};

export const lessonsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/lessons/', { params });
    return response.data;
  },
  create: async (lessonData) => {
    const response = await api.post('/lessons/', lessonData);
    return response.data;
  },
  update: async (id, lessonData) => {
    const response = await api.put(`/lessons/${id}/`, lessonData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/lessons/${id}/`);
    return response.data;
  },
  complete: async (id) => {
    const response = await api.post(`/lessons/${id}/complete/`);
    return response.data;
  },
  uncomplete: async (id) => {
    const response = await api.post(`/lessons/${id}/uncomplete/`);
    return response.data;
  },
};

export const assignmentsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/assignments/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/assignments/${id}/`);
    return response.data;
  },
  create: async (assignmentData) => {
    const formData = new FormData();
    Object.keys(assignmentData).forEach((key) => {
      if (assignmentData[key] !== null && assignmentData[key] !== undefined) {
        formData.append(key, assignmentData[key]);
      }
    });
    const response = await api.post('/assignments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  update: async (id, assignmentData) => {
    const formData = new FormData();
    Object.keys(assignmentData).forEach((key) => {
      if (assignmentData[key] !== null && assignmentData[key] !== undefined) {
        formData.append(key, assignmentData[key]);
      }
    });
    const response = await api.put(`/assignments/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/assignments/${id}/`);
    return response.data;
  },
};

export const assignmentSubmissionsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/assignment-submissions/', { params });
    return response.data;
  },
  create: async (submissionData) => {
    const formData = new FormData();
    Object.keys(submissionData).forEach((key) => {
      if (submissionData[key] !== null && submissionData[key] !== undefined) {
        formData.append(key, submissionData[key]);
      }
    });
    const response = await api.post('/assignment-submissions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  grade: async (id, payload) => {
    const response = await api.post(`/assignment-submissions/${id}/grade/`, payload);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.patch(`/assignment-submissions/${id}/`, payload);
    return response.data;
  },
  setStatus: async (id, status) => {
    const response = await api.post(`/assignment-submissions/${id}/set_status/`, { status });
    return response.data;
  },
};

export const questionBankAPI = {
  list: async (params = {}) => {
    const response = await api.get('/question-bank/', { params });
    return response.data;
  },
  create: async (entry) => {
    const response = await api.post('/question-bank/', entry);
    return response.data;
  },
  update: async (id, entry) => {
    const response = await api.put(`/question-bank/${id}/`, entry);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/question-bank/${id}/`);
    return response.data;
  },
};

export const quizzesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/quizzes/', { params });
    return response.data;
  },
  create: async (quizData) => {
    const response = await api.post('/quizzes/', quizData);
    return response.data;
  },
  update: async (id, quizData) => {
    const response = await api.put(`/quizzes/${id}/`, quizData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/quizzes/${id}/`);
    return response.data;
  },
};

export const quizSubmissionsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/quiz-submissions/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/quiz-submissions/${id}/`);
    return response.data;
  },
  submit: async (payload) => {
    const response = await api.post('/quiz-submissions/', payload);
    return response.data;
  },
};

export const analyticsAPI = {
  getInstructorSummary: async (params = {}) => {
    const response = await api.get('/analytics/instructor/', { params });
    return response.data;
  },
  getAdminSummary: async (params = {}) => {
    const response = await api.get('/analytics/admin/', { params });
    return response.data;
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: async () => {
    const response = await api.get('/enrollments/');
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  getAll: async () => {
    const response = await api.get('/wishlist/');
    return response.data;
  },
};

export const conversationsAPI = {
  list: async (params = {}) => {
    const response = await api.get('/conversations/', { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/conversations/${id}/`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post('/conversations/', payload);
    return response.data;
  },
  addParticipant: async (conversationId, userId) => {
    const response = await api.post(`/conversations/${conversationId}/add_participant/`, { user_id: userId });
    return response.data;
  },
  removeParticipant: async (conversationId, userId) => {
    const response = await api.post(`/conversations/${conversationId}/remove_participant/`, { user_id: userId });
    return response.data;
  },
};

export const messagesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/messages/', { params });
    return response.data;
  },
  create: async ({ conversation, body, attachment }) => {
    if (!conversation) throw new Error('conversation is required');
    const hasAttachment = attachment instanceof File;
    if (hasAttachment) {
      const formData = new FormData();
      formData.append('conversation', conversation);
      if (body) {
        formData.append('body', body);
      }
      formData.append('attachment', attachment);
      const response = await api.post('/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    }
    const response = await api.post('/messages/', { conversation, body });
    return response.data;
  },
  markRead: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/mark_read/`);
    return response.data;
  },
  update: async (id, payload) => {
    const response = await api.patch(`/messages/${id}/`, payload);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/messages/${id}/`);
    return response.data;
  },
};

export default api;

