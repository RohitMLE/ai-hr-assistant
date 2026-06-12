import { api } from '../client';

// Performance
export const getActiveCycles = () => api.get('/performance/cycles/active').then(r => r.data);
export const createGoal = (data) => api.post('/performance/goals', data).then(r => r.data);
export const getMyGoals = () => api.get('/performance/goals/my-goals').then(r => r.data);
export const submitSelfReview = (data) => api.post('/performance/reviews', data).then(r => r.data);
export const getTeamPendingReviews = () => api.get('/performance/reviews/team-pending').then(r => r.data);
export const submitManagerReview = (id, data) => api.post(`/performance/reviews/${id}/manager`, data).then(r => r.data);

// Learning
export const getCourses = () => api.get('/learning/courses').then(r => r.data);
export const getMyAssignments = () => api.get('/learning/my-assignments').then(r => r.data);
export const markAssignmentComplete = (id) => api.post(`/learning/assignments/${id}/complete`).then(r => r.data);

// Engagement
export const getAnnouncements = () => api.get('/engagement/announcements').then(r => r.data);
export const getActiveSurveys = () => api.get('/engagement/surveys/active').then(r => r.data);
export const respondToSurvey = (id, data) => api.post(`/engagement/surveys/${id}/respond`, data).then(r => r.data);

// Rewards
export const getMyRecognitions = () => api.get('/rewards/my-recognitions').then(r => r.data);
export const getWallOfFame = () => api.get('/rewards/wall-of-fame').then(r => r.data);
export const giveRecognition = (data) => api.post('/rewards/recognize', data).then(r => r.data);
