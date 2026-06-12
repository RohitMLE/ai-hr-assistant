import { api } from '../client';

export const getAuditLogs = () => api.get('/audit/logs').then((r) => r.data);
