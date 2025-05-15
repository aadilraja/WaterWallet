import axios from 'axios';
import { IP_ADDRESS } from '@env';

//const API_BASE = `http://${IP_ADDRESS}`;

const API_BASE="http://localhost:5000"

export const fetchAllocation = async () => {
  try {
    const response = await axios.get(`${API_BASE}/allocation/predict`);
    
    // Transform the data structure to match what the dashboard expects
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
    throw new Error('Failed to load water allocation data');
  }
};

/**
 * Fetch water usage data from the backend
 * @returns {Promise} Promise with usage data
 */
export const fetchUsage = async () => {
  try {
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
    throw new Error('Failed to load water usage data');
  }
};