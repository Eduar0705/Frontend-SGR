import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

const getAdvancedStats = async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    // En el backend agregamos el endpoint /advanced-stats
    const response = await axios.get(`${API_URL}/dashboard/advanced-stats?roleId=${user.id_rol}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

const getStudentStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/student`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

const getTeacherStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/dashboard/teacher`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

export default {
    getStats,
    getStudentStats,
    getTeacherStats,
    getAdvancedStats
};
