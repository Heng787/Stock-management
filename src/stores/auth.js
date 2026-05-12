import { defineStore } from 'pinia';
import client from '../api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: { name: 'Guest Admin', role: 'admin', email: 'admin@example.com' },
    token: 'mock-token',
    loading: false,
    error: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin'
  },
  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await client.post('/auth/login', { email, password });
        // The client interceptor already returns response.data
        // So 'response' here is { success: true, data: user }
        this.token = response.data.token;
        this.user = response.data;
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        return true;
      } catch (err) {
        this.error = err.error || err.message || 'Login failed';
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
