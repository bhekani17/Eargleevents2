import { publicAPI, adminAPI } from './api';

export const equipmentService = {
  // ==================== PUBLIC OPERATIONS ====================

  // Get all equipment (public)
  getAllEquipment: async (filters = {}) => {
    try {
      const response = await publicAPI.getEquipment(filters);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Get equipment by ID (public)
  getEquipmentById: async (id) => {
    try {
      return await publicAPI.getEquipmentById(id);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Get equipment by category (public)
  getEquipmentByCategory: async (category) => {
    return equipmentService.getAllEquipment({ category });
  },

  // Search equipment (public)
  searchEquipment: async (query, filters = {}) => {
    try {
      return await publicAPI.searchEquipment(query, filters);
    } catch (error) {
      console.error('Error searching equipment:', error);
      throw error;
    }
  },

  // Get featured equipment (public)
  getFeaturedEquipment: async () => {
    try {
      return await publicAPI.getFeaturedEquipment();
    } catch (error) {
      console.error('Error fetching featured equipment:', error);
      throw error;
    }
  },

  // ==================== ADMIN CRUD OPERATIONS ====================

  // Get all equipment (admin - with full data)
  getAllEquipmentAdmin: async (filters = {}) => {
    try {
      const response = await adminAPI.getEquipment(filters);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching equipment (admin):', error);
      throw error;
    }
  },

  // Get equipment by ID (admin)
  getEquipmentByIdAdmin: async (id) => {
    try {
      return await adminAPI.getEquipmentById(id);
    } catch (error) {
      console.error('Error fetching equipment (admin):', error);
      throw error;
    }
  },

  // Create new equipment (admin)
  createEquipment: async (equipmentData) => {
    try {
      console.log('Creating equipment with data:', JSON.stringify(equipmentData, null, 2));
      const response = await adminAPI.addEquipment(equipmentData);
      console.log('Equipment created successfully:', response?.data);
      return {
        success: true,
        data: response?.data,
        message: 'Equipment created successfully'
      };
    } catch (error) {
      console.error('Error creating equipment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw {
          ...error.response.data,
          message: error.response.data.message || 'Validation failed',
          status: 400
        };
      }
      
      throw {
        message: error.response?.data?.message || 'Failed to create equipment',
        status: error.response?.status || 500,
        errors: error.response?.data?.errors
      };
    }
  },

  // Update equipment (admin)
  updateEquipment: async (id, equipmentData) => {
    try {
      if (!id) throw new Error('Equipment ID is required for update');
      
      console.log(`Updating equipment ${id} with data:`, JSON.stringify(equipmentData, null, 2));
      const response = await adminAPI.updateEquipment(id, equipmentData);
      console.log('Equipment updated successfully:', response?.data);
      
      return {
        success: true,
        data: response?.data,
        message: 'Equipment updated successfully'
      };
    } catch (error) {
      console.error('Error updating equipment:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw {
          ...error.response.data,
          message: error.response.data.message || 'Validation failed',
          status: 400
        };
      }
      
      throw {
        message: error.response?.data?.message || 'Failed to update equipment',
        status: error.response?.status || 500,
        errors: error.response?.data?.errors
      };
    }
  },

  // Delete equipment (admin)
  deleteEquipment: async (id) => {
    try {
      if (!id) throw new Error('Equipment ID is required for deletion');
      
      console.log('Deleting equipment:', id);
      const response = await adminAPI.deleteEquipment(id);
      console.log('Equipment deleted successfully:', id);
      
      return {
        success: true,
        message: 'Equipment deleted successfully',
        data: response?.data
      };
    } catch (error) {
      console.error('Error deleting equipment:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      throw {
        message: error.response?.data?.message || 'Failed to delete equipment',
        status: error.response?.status || 500
      };
    }
  },

  // Update equipment status (admin)
  updateEquipmentStatus: async (id, status) => {
    try {
      const response = await adminAPI.updateEquipmentStatus(id, status);
      console.log('Equipment status updated:', response);
      return response;
    } catch (error) {
      console.error('Error updating equipment status:', error);
      throw error;
    }
  },

  // Update inventory (admin)
  updateInventory: async (id, inventoryData) => {
    try {
      const response = await adminAPI.updateEquipment(id, { inventory: inventoryData });
      console.log('Equipment inventory updated:', response);
      return response;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  },

  // Get equipment categories (admin)
  getEquipmentCategories: async () => {
    try {
      return await adminAPI.getEquipmentCategories();
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      throw error;
    }
  },

  // Bulk operations (admin)
  bulkUpdateEquipment: async (updates) => {
    try {
      const promises = updates.map(({ id, data }) => 
        adminAPI.updateEquipment(id, data)
      );
      const results = await Promise.all(promises);
      console.log('Bulk equipment update completed:', results);
      return results;
    } catch (error) {
      console.error('Error in bulk equipment update:', error);
      throw error;
    }
  }
};

export default equipmentService; 