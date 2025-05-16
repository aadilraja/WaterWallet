// src/services/api.js - FIXED VERSION
import axios from 'axios';

import { IP_ADDRESS } from '@env';

const getApiBaseUrl = () => {
 
  
  // For iOS simulators or web
  return 'http://localhost:8081';
};

const API_BASE = getApiBaseUrl();
console.log('API Base URL:', API_BASE);

export const fetchAllocation = async () => {
  try {
    console.log('Fetching allocation data...');
    const response = await axios.get(`${API_BASE}/allocation/predict`);
    
    const allocations = response.data.allocations || {};
    
    return {
      data: {
        kitchen: allocations.kitchen || 0,
        bathroom: allocations.bathroom || 0,
        garden: allocations.garden || 0,
        outdoor: allocations.outdoor || 0,
        total: response.data.predicted_total_L || 0
      }
    };
  } catch (error) {
    console.error('Error fetching allocation data:', error);
    // Return default values instead of throwing to prevent crashes
    return {
      data: {
        kitchen: 0,
        bathroom: 0,
        garden: 0,
        outdoor: 0,
        total: 0
      }
    };
  }
};

/**
 * Fetch water usage data from the backend
 * @returns {Promise} Promise with usage data
 */
export const fetchUsage = async () => {
  try {
    console.log('Fetching usage data...');
    const response = await axios.get(`${API_BASE}/waterUsage/detail`);
    
    // Get the most recent usage entry (first item if sorted by desc)
    const latestUsage = response.data.data && response.data.data.length > 0 
      ? response.data.data[0] 
      : { kitchen: 0, bathroom: 0, garden: 0, outdoor: 0, total: 0 };
    
    return {
      data: latestUsage
    };
  } catch (error) {
    console.error('Error fetching usage data:', error);
    // Return default values instead of throwing to prevent crashes
    return {
      data: {
        kitchen: 0,
        bathroom: 0,
        garden: 0,
        outdoor: 0,
        total: 0
      }
    };
  }
};