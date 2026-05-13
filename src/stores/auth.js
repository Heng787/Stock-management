import { defineStore } from 'pinia';
import client from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'ADMIN'
  },
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await client.post('/auth/login', { email, password });
        // The client interceptor already returns response.data
        // So 'response' here is { success: true, data: user }
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(this.user));
        return true;
      } catch (err) {
        this.error = err.error || err.message || 'Login failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      try {
        await client.post('/auth/logout');
      } finally {
        this.user = null;
        localStorage.removeItem('user');
      }
    }
  }
});
