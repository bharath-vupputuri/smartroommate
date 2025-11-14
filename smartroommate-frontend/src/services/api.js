import axios from 'axios';
const API_BASE = 'http://localhost:5000/api';

export const submitProfile = (data) => axios.post(`${API_BASE}/submit`, data);
export const getMatches     = (id)   => axios.get(`${API_BASE}/match/${id}`);
export const getMatchesByUsername = (username) => axios.get(`${API_BASE}/match/username/${username}`);
export const getProfile     = (id)   => axios.get(`${API_BASE}/profile/${id}`);
export const getProfileByUsername = (username) => axios.get(`${API_BASE}/profile/username/${username}`);
export const updateProfile  = (id,d) => axios.put(`${API_BASE}/profile/${id}`, d);
export const seedUsers      = (n=12) => axios.post(`${API_BASE}/seed?n=${n}`);
export const getAllUsers    = ()     => axios.get(`${API_BASE}/analytics/users`);
export const getAnalyticsStats = () => axios.get(`${API_BASE}/analytics/stats`);
