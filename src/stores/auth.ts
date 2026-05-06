import { defineStore } from 'pinia';
import api from '@/api/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isStaff: (state) => state.user?.role === 'STAFF',
    isTeacher: (state) => state.user?.role === 'TEACHER',
  },
  actions: {
    async login(credentials: any) {
      const response: any = await api.post('/auth/login', credentials);
      if (response.success) {
        this.token = response.data.token;
        this.user = {
          username: response.data.username,
          role: response.data.role,
          teacherId: response.data.teacherId,
        };
        localStorage.setItem('token', this.token as string);
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      return response;
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    async fetchProfile() {
      if (!this.token) return;
      try {
        const res: any = await api.get('/auth/me');
        if (res.success) {
          this.user = res.data;
          localStorage.setItem('user', JSON.stringify(this.user));
        }
      } catch (err) {
        this.logout();
      }
    }
  }
});
