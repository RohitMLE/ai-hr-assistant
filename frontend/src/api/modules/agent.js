import { api } from '../client';

export const sendAgentMessage = (message) =>
  api.post('/agent/chat', { message }).then((r) => r.data);
