import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

const periodosService = {
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
    }
};

export default periodosService;