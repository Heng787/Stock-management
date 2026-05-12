// src/api/settingsApi.js
import client from './client.js';

export const fetchSettings = () => client.get('/settings');
export const updateSettings = (data) => client.patch('/settings', data);
export const uploadLogo = (formData) => client.post('/settings/logo', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const triggerBackup = () => client.post('/settings/backup');
export const clearDatabase = () => client.post('/settings/clear');
export const exportData = (resource) => client.get(`/settings/export/${resource}`, { responseType: 'blob' });
