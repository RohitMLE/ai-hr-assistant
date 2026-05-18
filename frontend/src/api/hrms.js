import { api } from './client';

export const login = (payload) => api.post('/auth/login', payload).then((res) => res.data);
export const getMe = () => api.get('/auth/me').then((res) => res.data);
export const getEmployeeMe = () => api.get('/employee/me').then((res) => res.data);
export const getLeaveBalance = () => api.get('/leave/balance').then((res) => res.data);
export const getMyLeaveRequests = () => api.get('/leave/my-requests').then((res) => res.data);
export const applyLeave = (payload) => api.post('/leave/apply', payload).then((res) => res.data);
export const getAttendanceSummary = (month) =>
  api.get('/attendance/summary', { params: { month } }).then((res) => res.data);
export const getPendingLeaveRequests = () =>
  api.get('/manager/leave/pending').then((res) => res.data);
export const approveLeave = (leaveId, comment = 'Approved') =>
  api.post(`/manager/leave/${leaveId}/approve`, { comment }).then((res) => res.data);
export const rejectLeave = (leaveId, comment = 'Rejected') =>
  api.post(`/manager/leave/${leaveId}/reject`, { comment }).then((res) => res.data);
export const getAuditLogs = () => api.get('/audit/logs').then((res) => res.data);
export const sendAgentMessage = (message) =>
  api.post('/agent/chat', { message }).then((res) => res.data);
