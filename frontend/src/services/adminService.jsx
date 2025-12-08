// src/services/adminService.jsx
import apiClient from '../config/axios.js';

const adminService = {
  // Get all users (Admin only)
  getAllUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.hostelId) params.append('hostelId', filters.hostelId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiClient.get(`/users?${params.toString()}`);
      return response.data.users || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id, updates) => {
    try {
      const response = await apiClient.put(`/users/${id}`, updates);
      return response.data.user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user (Admin only)
  deleteUser: async (id) => {
    try {
      const response = await apiClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Get workers by hostel
  getWorkersByHostel: async (hostelId) => {
    try {
      const response = await apiClient.get(`/users/hostels/${hostelId}/workers`);
      return response.data.workers || [];
    } catch (error) {
      console.error('Error fetching workers by hostel:', error);
      throw error;
    }
  },

  // Get workers by skill
  getWorkersBySkill: async (skill) => {
    try {
      const response = await apiClient.get(`/users/skills/${skill}/workers`);
      return response.data.workers || [];
    } catch (error) {
      console.error('Error fetching workers by skill:', error);
      throw error;
    }
  },

  // Get all hostels
  getAllHostels: async () => {
    try {
      const response = await apiClient.get('/hostels');
      return response.data.hostels || [];
    } catch (error) {
      console.error('Error fetching hostels:', error);
      throw error;
    }
  },

  // Get hostel by ID
  getHostelById: async (id) => {
    try {
      const response = await apiClient.get(`/hostels/${id}`);
      return response.data.hostel;
    } catch (error) {
      console.error('Error fetching hostel:', error);
      throw error;
    }
  },

  // Create hostel (Admin only)
  createHostel: async (hostelData) => {
    try {
      const response = await apiClient.post('/hostels', hostelData);
      return response.data.hostel;
    } catch (error) {
      console.error('Error creating hostel:', error);
      throw error;
    }
  },

  // Update hostel (Admin only)
  updateHostel: async (id, updates) => {
    try {
      const response = await apiClient.put(`/hostels/${id}`, updates);
      return response.data.hostel;
    } catch (error) {
      console.error('Error updating hostel:', error);
      throw error;
    }
  },

  // Delete hostel (Admin only)
  deleteHostel: async (id) => {
    try {
      const response = await apiClient.delete(`/hostels/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting hostel:', error);
      throw error;
    }
  },

  // Add worker to hostel (Admin only)
  addWorkerToHostel: async (hostelId, workerId) => {
    try {
      const response = await apiClient.post(`/hostels/${hostelId}/workers`, { workerId });
      return response.data;
    } catch (error) {
      console.error('Error adding worker to hostel:', error);
      throw error;
    }
  },

  // Remove worker from hostel (Admin only)
  removeWorkerFromHostel: async (hostelId, workerId) => {
    try {
      const response = await apiClient.delete(`/hostels/${hostelId}/workers`, {
        data: { workerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing worker from hostel:', error);
      throw error;
    }
  },

  // Create admin user (Admin only - for adding another admin to their hostel)
  createAdmin: async (adminData) => {
    try {
      const response = await apiClient.post('/auth/register', adminData);
      return response.data;
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  },
};

export { adminService };
export default adminService;

