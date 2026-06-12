import { api } from '../client';

export const getRecruitmentDashboard = () => api.get('/recruitment/dashboard').then((r) => r.data);
export const createJob = (payload) => api.post('/recruitment/jobs', payload).then((r) => r.data);
export const moveCandidateToNextStage = (candidateId, payload = {}) =>
  api.post(`/recruitment/candidates/${candidateId}/next-stage`, payload).then((r) => r.data);
export const hireCandidate = (candidateId) =>
  api.post(`/recruitment/candidates/${candidateId}/hire`).then((r) => r.data);
export const approveJob = (jobId) =>
  api.post(`/recruitment/jobs/${jobId}/approve`).then((r) => r.data);
export const submitInterviewFeedback = (candidateId, payload) =>
  api.post(`/recruitment/candidates/${candidateId}/feedback`, payload).then((r) => r.data);
