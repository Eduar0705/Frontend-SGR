import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

const getProfile = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/usuarios/profile`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const changePassword = async (newPassword) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/usuarios/change-password`, { newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getProfile,
    changePassword
};
