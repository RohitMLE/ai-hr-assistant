import { api } from '../client';

export const getOnboardingDashboard = () =>
  api.get('/onboarding/dashboard').then((r) => r.data);

export const listOnboardingCases = (params) =>
  api.get('/onboarding/cases', { params }).then((r) => r.data);

export const createOnboardingCase = (data) =>
  api.post('/onboarding/cases', data).then((r) => r.data);

export const updateOnboardingTask = (taskId, data) =>
  api.patch(`/onboarding/tasks/${taskId}`, data).then((r) => r.data);

export const createAssetRequest = (caseId, data) =>
  api.post(`/onboarding/cases/${caseId}/assets`, data).then((r) => r.data);

export const acknowledgePolicy = (policyId) =>
  api.post(`/onboarding/policies/${policyId}/acknowledge`).then((r) => r.data);
