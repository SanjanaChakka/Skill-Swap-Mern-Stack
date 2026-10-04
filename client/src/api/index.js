import api from './client.js';

export const errMsg = (err, fallback = 'Something went wrong') => {
  const m = err?.response?.data?.message || err?.message;
  return m || fallback;
};

export const authApi = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const userApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  update: (data) => api.put('/users/me', data).then((r) => r.data),
  updateWithPhoto: (formData) =>
    api.put('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  profile: (id) => api.get(`/users/${id}`).then((r) => r.data),
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  setAvailability: (data) => api.put('/users/me/availability', data).then((r) => r.data),
  requestVerification: () => api.post('/users/me/verification').then((r) => r.data),
  bookmark: (listingId) => api.post('/users/me/bookmarks', { listingId }).then((r) => r.data),
  bookmarks: () => api.get('/users/me/bookmarks').then((r) => r.data),
};

export const listingApi = {
  search: (params) => api.get('/listings', { params }).then((r) => r.data),
  get: (id) => api.get(`/listings/${id}`).then((r) => r.data),
  create: (data) => api.post('/listings', data).then((r) => r.data),
  update: (id, data) => api.put(`/listings/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/listings/${id}`).then((r) => r.data),
  mine: () => api.get('/listings/mine').then((r) => r.data),
  featured: () => api.get('/listings/featured').then((r) => r.data),
  categories: () => api.get('/listings/categories').then((r) => r.data),
};

export const matchApi = {
  recommendations: (params) => api.get('/matches', { params }).then((r) => r.data),
};

export const swapApi = {
  list: (params) => api.get('/swaps', { params }).then((r) => r.data),
  get: (id) => api.get(`/swaps/${id}`).then((r) => r.data),
  summary: (id) => api.get(`/swaps/summary/${id}`).then((r) => r.data),
  create: (data) => api.post('/swaps', data).then((r) => r.data),
  action: (id, action, data) => api.post(`/swaps/${id}/${action}`, data || {}).then((r) => r.data),
};

export const messageApi = {
  conversations: () => api.get('/conversations').then((r) => r.data),
  getOrCreate: (data) => api.post('/conversations', data).then((r) => r.data),
  messages: (id) => api.get(`/conversations/${id}`).then((r) => r.data),
  send: (id, data) => api.post(`/conversations/${id}/messages`, data).then((r) => r.data),
  shareVideo: (id, url) => api.post(`/conversations/${id}/video-link`, { videoLink: url }).then((r) => r.data),
  read: (id) => api.get(`/conversations/${id}/read`),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
};

export const reviewApi = {
  create: (data) => api.post('/reviews', data).then((r) => r.data),
  pending: () => api.get('/reviews/pending').then((r) => r.data),
  forUser: (userId) => api.get(`/reviews/user/${userId}`).then((r) => r.data),
};

export const feedApi = {
  get: (params) => api.get('/feed', { params }).then((r) => r.data),
};

export const disputeApi = {
  create: (data) => api.post('/disputes', data).then((r) => r.data),
  mine: () => api.get('/disputes').then((r) => r.data),
  get: (id) => api.get(`/disputes/${id}`).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data),
  analytics: () => api.get('/admin/analytics').then((r) => r.data),
  users: (params) => api.get('/admin/users', { params }).then((r) => r.data),
  listings: (params) => api.get('/admin/listings', { params }).then((r) => r.data),
  swaps: (params) => api.get('/admin/swaps', { params }).then((r) => r.data),
  disputes: (params) => api.get('/admin/disputes', { params }).then((r) => r.data),
  verificationQueue: () => api.get('/admin/verification-queue').then((r) => r.data),
  flagListing: (id, reason) => api.post(`/admin/listings/${id}/flag`, { reason }).then((r) => r.data),
  unflagListing: (id) => api.post(`/admin/listings/${id}/unflag`).then((r) => r.data),
  flagUser: (id, reason) => api.post(`/admin/users/${id}/flag`, { reason }).then((r) => r.data),
  unflagUser: (id) => api.post(`/admin/users/${id}/unflag`).then((r) => r.data),
  verifyUser: (id) => api.post(`/admin/users/${id}/verify`).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  resolveDispute: (id, data) => api.post(`/admin/disputes/${id}/resolve`, data).then((r) => r.data),
};
