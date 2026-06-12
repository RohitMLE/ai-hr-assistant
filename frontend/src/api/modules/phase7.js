import { api } from '../client';

// Assets
export const getInventory = () => api.get('/assets/inventory').then(r => r.data);
export const addAsset = (data) => api.post('/assets/inventory', data).then(r => r.data);
export const getMyAssets = () => api.get('/assets/my-assets').then(r => r.data);
export const assignAsset = (assetId, employeeId) => api.post(`/assets/assign/${assetId}/${employeeId}`).then(r => r.data);

// Helpdesk
export const createTicket = (data) => api.post('/helpdesk/tickets', data).then(r => r.data);
export const getMyTickets = () => api.get('/helpdesk/my-tickets').then(r => r.data);
export const getAllTickets = () => api.get('/helpdesk/all-tickets').then(r => r.data);
export const addTicketComment = (id, data) => api.post(`/helpdesk/tickets/${id}/comment`, data).then(r => r.data);
export const resolveTicket = (id) => api.post(`/helpdesk/tickets/${id}/resolve`).then(r => r.data);

// Compliance V2
export const getMyAcknowledgments = () => api.get('/compliance/my-acknowledgments').then(r => r.data);
export const acknowledgePolicy = (id) => api.post(`/compliance/policies/${id}/acknowledge`).then(r => r.data);

// Exits
export const submitExitRequest = (data) => api.post('/exits/request', data).then(r => r.data);
export const getMyExitRequests = () => api.get('/exits/my-request').then(r => r.data);
export const getPendingExitRequests = () => api.get('/exits/pending').then(r => r.data);
export const approveExitRequest = (id) => api.post(`/exits/${id}/approve`).then(r => r.data);
export const clearExitTask = (id) => api.post(`/exits/tasks/${id}/clear`).then(r => r.data);
