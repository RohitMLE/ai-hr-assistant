import { api } from '../client';

export const getMyPayslips = () => api.get('/payroll/my-payslips').then((r) => r.data);

export const processPayrollRun = (month) => api.post(`/payroll/runs/process?month=${month}`).then((r) => r.data);

export const getPayrollRuns = () => api.get('/payroll/runs').then((r) => r.data);

export const approvePayrollRun = (runId) => api.post(`/payroll/runs/${runId}/approve`).then((r) => r.data);
