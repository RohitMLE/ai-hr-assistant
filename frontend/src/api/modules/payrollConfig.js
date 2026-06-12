import { api } from '../client';

export const getPayrollComponents = () => api.get('/payroll-config/components').then((r) => r.data);

export const getTaxSlabs = () => api.get('/payroll-config/tax-slabs').then((r) => r.data);

export const getComplianceSettings = () => api.get('/payroll-config/compliance').then((r) => r.data);
