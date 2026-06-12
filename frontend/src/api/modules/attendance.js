import { api } from '../client';

export const getAttendanceSummary = (month) =>
  api.get('/attendance/summary', { params: { month } }).then((r) => r.data);
export const applyRegularization = (payload) =>
  api.post('/attendance/regularization/apply', payload).then((r) => r.data);
export const getMyRegularizationRequests = () =>
  api.get('/attendance/regularization/my-requests').then((r) => r.data);
export const getPendingRegularizationRequests = () =>
  api.get('/attendance/regularization/manager/pending').then((r) => r.data);
export const approveRegularization = (requestId, comment = 'Approved') =>
  api.post(`/attendance/regularization/manager/${requestId}/approve`, { comment }).then((r) => r.data);
export const rejectRegularization = (requestId, comment = 'Rejected') =>
  api.post(`/attendance/regularization/manager/${requestId}/reject`, { comment }).then((r) => r.data);

export const clockIn = () => api.post('/attendance/clock-in').then((r) => r.data);
export const clockOut = () => api.post('/attendance/clock-out').then((r) => r.data);
export const getTeamAttendanceSummary = (month) =>
  api.get('/attendance/team-summary', { params: { month } }).then((r) => r.data);
