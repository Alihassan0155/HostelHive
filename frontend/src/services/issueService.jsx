// src/services/issueService.jsx
import apiClient from '../config/axios.js';

const issueService = {
  // Get all issues for the current user (filtered by role on backend)
  getMyIssues: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`/issues?${params.toString()}`);
      return response.data.issues || [];
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  },

  // Get a single issue by ID
  getIssueById: async (id) => {
    try {
      const response = await apiClient.get(`/issues/${id}`);
      return response.data.issue;
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error;
    }
  },

  // Create a new issue
  createIssue: async (issueData) => {
    try {
      const response = await apiClient.post('/issues', issueData);
      return response.data.issue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  },

  // Update an issue
  updateIssue: async (id, updates) => {
    try {
      const response = await apiClient.put(`/issues/${id}`, updates);
      return response.data.issue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  },

  // Confirm issue fix (Student only)
  confirmFix: async (id, isFixed) => {
    try {
      const response = await apiClient.put(`/issues/${id}/confirm`, { isFixed });
      return response.data.issue;
    } catch (error) {
      console.error('Error confirming issue:', error);
      throw error;
    }
  },

  // Removed getUrgentIssues - urgency levels no longer exist

  // Update issue status (Worker/Admin)
  updateStatus: async (id, status) => {
    try {
      const response = await apiClient.put(`/issues/${id}/status`, { status });
      return response.data.issue;
    } catch (error) {
      console.error('Error updating issue status:', error);
      throw error;
    }
  },

  // Add worker update/notes (Worker only)
  addWorkerUpdate: async (id, notes, photos = []) => {
    try {
      const response = await apiClient.put(`/issues/${id}/update`, { notes, photos });
      return response.data.issue;
    } catch (error) {
      console.error('Error adding worker update:', error);
      throw error;
    }
  },

  // Assign worker to issue (Admin only)
  assignWorker: async (id, workerId) => {
    try {
      const body = { workerId };
      const response = await apiClient.put(`/issues/${id}/assign`, body);
      return response.data.issue;
    } catch (error) {
      console.error('Error assigning worker:', error);
      throw error;
    }
  },

  // Submit rating for completed issue (Student only)
  submitRating: async (issueId, rating, feedback = '') => {
    try {
      const response = await apiClient.post(`/issues/${issueId}/rating`, {
        rating,
        feedback,
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error;
    }
  },

  // Get unrated completed issues (Student only)
  getUnratedIssues: async () => {
    try {
      const response = await apiClient.get('/issues/unrated');
      return response.data.issues || [];
    } catch (error) {
      console.error('Error fetching unrated issues:', error);
      throw error;
    }
  },
};

export { issueService };
export default issueService;
