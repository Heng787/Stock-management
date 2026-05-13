// src/stores/settings.js
import { defineStore } from 'pinia';
import * as settingsApi from '../api/settingsApi';
import { useUIStore } from './ui';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    config: {
      business: { name: 'StockFlow Pro', logo: '', address: '', phone: '', email: '' },
      localization: { currency: 'USD', dateFormat: 'DD/MM/YYYY', timezone: 'UTC' },
      inventory: { lowStockAlerts: true, skuPrefixEnabled: true, defaultTaxRate: 0 },
      security: { auditLogRetentionDays: 90, roles: {} },
      ui: { theme: 'system', sidebarCollapsed: false }
    },
    loading: false
  }),
  actions: {
    async loadSettings() {
      this.loading = true;
      try {
        const res = await settingsApi.fetchSettings();
        // client interceptor returns response.data (the HTTP body): { success, data: {...mongoDoc} }
        // We need res.data to get the actual settings document
        if (res?.data) {
          const doc = res.data;
          this.config = {
            ...this.config,
            business: { ...this.config.business, ...doc.business },
            localization: { ...this.config.localization, ...doc.localization },
            inventory: { ...this.config.inventory, ...doc.inventory },
            security: { ...this.config.security, ...doc.security },
            ui: { ...this.config.ui, ...doc.ui }
          };
        }
        this.applyTheme();
      } catch {
        console.warn('[Settings] Failed to load from server, using defaults');
      } finally {
        this.loading = false;
      }
    },
    async saveSettings(category, data) {
      const ui = useUIStore();
      try {
        const res = await settingsApi.updateSettings({ [category]: data });
        // client interceptor: res = { success, data: {...updatedMongoDoc} }
        if (res?.data?.[category]) {
          this.config[category] = { ...this.config[category], ...res.data[category] };
        }
        ui.notify('Settings updated successfully', 'success');
        if (category === 'ui') this.applyTheme();
      } catch {
        ui.notify('Failed to update settings', 'error');
      }
    },
    async uploadLogo(file) {
      const ui = useUIStore();
      try {
        const formData = new FormData();
        formData.append('logo', file);
        const res = await settingsApi.uploadLogo(formData);
        // settingsApi.uploadLogo returns the raw response or response.data?
        // client.js interceptor returns response.data
        if (res?.success && res?.data?.logo) {
          this.config.business.logo = res.data.logo;
          ui.notify('Logo updated successfully', 'success');
        }
      } catch (err) {
        ui.notify(err.error || 'Failed to upload logo', 'error');
      }
    },
    applyTheme() {
      const theme = this.config.ui.theme;
      const root = document.documentElement;
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    }
  }
});
