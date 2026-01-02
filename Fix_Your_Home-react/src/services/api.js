import axios from 'axios';

const api = {
  // Auth endpoints
  registerUser: (data) => axios.post('/api/register/user', data),
  registerWorker: (data) => axios.post('/api/register/worker', data),
  login: (data) => axios.post('/api/login', data),
  logout: () => axios.post('/api/logout'),
  getMe: () => axios.get('/api/me'),
  forgotPassword: (data) => axios.post('/api/forgot-password', data),
  resetPassword: (data) => axios.post('/api/reset-password', data),

  // Service endpoints
  getAvailableServices: () => axios.get('/api/available-services'),

  // Admin endpoints
  getAdminStats: () => axios.get('/api/admin/stats'),
  getPendingApprovals: (params = {}) => axios.get('/api/admin/pending-approvals', { params }),
  approveWorker: (workerId) => axios.post(`/api/admin/workers/${workerId}/approve`),
  rejectWorker: (workerId) => axios.post(`/api/admin/workers/${workerId}/reject`),

  // Worker endpoints
  getWorkers: (params = {}) => axios.get('/api/workers', { params }),
  getTopWorkersOfMonth: (params = {}) => axios.get('/api/workers/top-month', { params }),
  getWorker: (id) => axios.get(`/api/workers/${id}`),
  updateWorkerLocation: (data) => axios.post('/api/worker/location', data),
  getMyWorkerProfile: () => axios.get('/api/worker/profile'),
  getAvailableJobs: (params = {}) => axios.get('/api/worker/available-jobs', { params }),
  getMyJobs: (params = {}) => axios.get('/api/worker/my-jobs', { params }),
  applyForJob: (jobRequestId, data) => axios.post(`/api/worker/jobs/${jobRequestId}/apply`, data),
  acceptJob: (jobRequestId) => axios.post(`/api/worker/jobs/${jobRequestId}/accept`),
  startJob: (jobRequestId) => axios.post(`/api/worker/jobs/${jobRequestId}/start`),
  completeJob: (jobRequestId, data) => axios.post(`/api/worker/jobs/${jobRequestId}/complete`, data),

  // User endpoints
  getJobRequests: (params = {}) => axios.get('/api/user/job-requests', { params }),
  createJobRequest: (data) => axios.post('/api/user/job-requests', data),
  acceptWorkerApplication: (jobRequestId, applicationId) => axios.post(`/api/user/job-requests/${jobRequestId}/applications/${applicationId}/accept`),
  deleteJobRequest: (jobRequestId) => axios.delete(`/api/user/job-requests/${jobRequestId}`),
  getNearestWorkers: (params = {}) => axios.get('/api/workers/nearest', { params }),

  // Ratings
  rateJob: (jobRequestId, data) => axios.post(`/api/user/job-requests/${jobRequestId}/rating`, data),

  // Rewards
  getAvailableRewards: () => axios.get('/api/user/rewards/available'),
  setRewardsOptIn: (optIn) => axios.post('/api/user/rewards/opt-in', { opt_in: !!optIn }),

};

export default api;

