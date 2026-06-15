import { api } from '../client';

export const getOrgHierarchy = () => api.get('/org/hierarchy').then((r) => r.data);

// Employee Master
export const listEmployees = (params) =>
  api.get('/employees', { params }).then((r) => r.data);

export const getEmployee = (id) =>
  api.get(`/employees/${id}`).then((r) => r.data);

export const getMyEmployeeCentral = () =>
  api.get('/employees/me/central').then((r) => r.data);

export const createEmployee = (data) =>
  api.post('/employees', data).then((r) => r.data);

export const updateEmployee = (id, data) =>
  api.patch(`/employees/${id}`, data).then((r) => r.data);

// Sub-resources
export const addDocument = (employeeId, data) =>
  api.post(`/employees/${employeeId}/documents`, data).then((r) => r.data);

export const verifyDocument = (employeeId, docId) =>
  api.post(`/employees/${employeeId}/documents/${docId}/verify`).then((r) => r.data);

export const addBankDetail = (employeeId, data) =>
  api.post(`/employees/${employeeId}/bank-details`, data).then((r) => r.data);

export const addEmergencyContact = (employeeId, data) =>
  api.post(`/employees/${employeeId}/emergency-contacts`, data).then((r) => r.data);

export const addJobHistory = (employeeId, data) =>
  api.post(`/employees/${employeeId}/job-history`, data).then((r) => r.data);

// Reference data
export const getWorkLocations = () =>
  api.get('/employees/meta/work-locations').then((r) => r.data);

export const getEmploymentTypes = () =>
  api.get('/employees/meta/employment-types').then((r) => r.data);
