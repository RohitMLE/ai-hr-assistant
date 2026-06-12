import { api } from '../client';

export const createTravelRequest = (data) => api.post('/expenses/travel', data).then(r => r.data);
export const getMyTravelRequests = () => api.get('/expenses/travel/my-requests').then(r => r.data);
export const getTeamPendingTravel = () => api.get('/expenses/travel/team-pending').then(r => r.data);
export const getFinancePendingTravel = () => api.get('/expenses/travel/finance-pending').then(r => r.data);
export const approveTravelManager = (id) => api.post(`/expenses/travel/${id}/approve`).then(r => r.data);
export const disburseTravelAdvance = (id) => api.post(`/expenses/travel/${id}/disburse`).then(r => r.data);

export const createExpenseClaim = (data) => api.post('/expenses/claims', data).then(r => r.data);
export const getMyExpenseClaims = () => api.get('/expenses/claims/my-claims').then(r => r.data);
export const getTeamPendingClaims = () => api.get('/expenses/claims/team-pending').then(r => r.data);
export const getFinancePendingClaims = () => api.get('/expenses/claims/finance-pending').then(r => r.data);
export const approveClaimManager = (id) => api.post(`/expenses/claims/${id}/approve-manager`).then(r => r.data);
export const approveClaimFinance = (id) => api.post(`/expenses/claims/${id}/approve-finance`).then(r => r.data);
