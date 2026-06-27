import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import router from '@/router';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const toastStore = useToastStore();
    const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau';
    toastStore.error(message);

    if (error.response?.status === 401 || error.response?.status === 403) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push('/login');
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
