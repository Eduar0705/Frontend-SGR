import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const periodosService = {
    getPeriodos: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/periodos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching periodos:', error);
            return { success: false, data: [] };
        }
    },
    getCortes: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/periodos/cortes`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data;
    }
};

export default periodosService;