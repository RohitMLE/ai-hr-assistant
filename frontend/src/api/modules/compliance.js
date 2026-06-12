import { api } from '../client';

export const getAllPolicies = () => api.get('/compliance/policies').then((r) => r.data.items || []);
export const searchPolicies = (q) =>
  api.get('/compliance/policies/search', { params: { q } }).then((r) => r.data);
