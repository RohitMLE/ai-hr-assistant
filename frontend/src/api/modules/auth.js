import { api } from '../client';

export const login = (payload) => api.post('/auth/login', payload).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
export const getEmployeeMe = () => api.get('/auth/employee/me').then((r) => r.data);
