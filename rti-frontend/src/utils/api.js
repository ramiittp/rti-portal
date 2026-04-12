import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust to your backend
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rti_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;