import axios from 'axios';

const API_BASE = 'http://http://localhost:5000/'; // Replace with your Flask server URL

export const fetchAllocation = () => axios.get(`${API_BASE}/allocation/predict`);
export const fetchUsage = () => axios.get(`${API_BASE}/waterUsage/detail`);