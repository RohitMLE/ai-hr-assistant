import { api } from '../client';

export const getLeaveBalance = () => api.get('/leave/balance').then((r) => r.data);
export const getMyLeaveRequests = () => api.get('/leave/my-requests').then((r) => r.data);
export const applyLeave = (payload) => api.post('/leave/apply', payload).then((r) => r.data);
export const getPendingLeaveRequests = () => api.get('/leave/manager/pending').then((r) => r.data);
export const approveLeave = (leaveId, comment = 'Approved') =>
  api.post(`/leave/manager/${leaveId}/approve`, { comment }).then((r) => r.data);
export const rejectLeave = (leaveId, comment = 'Rejected') =>
  api.post(`/leave/manager/${leaveId}/reject`, { comment }).then((r) => r.data);

export const getTeamLeaveReports = () => api.get('/leave/team-reports').then((r) => r.data);
