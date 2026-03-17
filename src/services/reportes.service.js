import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const reportesService = {
    async getAdminStats() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/reportes/data`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data.stats || null;
    }
};
