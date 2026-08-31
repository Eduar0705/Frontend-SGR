import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

const getStats = async () => {
    const token = localStorage.getItem('token');
    let periodo = null;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        periodo = user?.periodo_usuario || null;
    } catch {}
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
        params: { periodo },
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

const getAdvancedStats = async () => {
    const token = localStorage.getItem('token');
    let roleId = null;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        roleId = user?.id_rol || '';
    } catch {}
    const response = await axios.get(`${API_URL}/dashboard/advanced-stats?roleId=${roleId}`, {
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
