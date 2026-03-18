import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const periodosService = {
    getPeriodos: async () => {
        try {
            const response = await axios.get(`${API_URL}/periodos`, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching periodos:', error);
            return { success: false, data: [] };
        }
    },

    getCortes: async () => {
        const response = await axios.get(`${API_URL}/periodos/cortes`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: getAuthHeaders()
        });
        return response.data;
    },

    getCortesByPeriodo: async (codigoPeriodo) => {
        try {
            const response = await axios.get(`${API_URL}/periodos/cortes/`, {
                params: { periodo: codigoPeriodo },
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching cortes:', error);
            return { success: false, data: [] };
        }
    },

    createCorte: async (data) => {
        try {
            const response = await axios.post(`${API_URL}/periodos/crearcorte`, data, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating corte:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al crear corte' };
        }
    },

    updateCorte: async (codigoPeriodo, orden, data) => {
        try {
            const response = await axios.put(`${API_URL}/periodos/updcortes/${codigoPeriodo}/${orden}`, data, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating corte:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar corte' };
        }
    },

    deleteCorte: async (codigoPeriodo, orden) => {
        try {
            const response = await axios.delete(`${API_URL}/periodos/deletecorte/${codigoPeriodo}/${orden}`, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error deleting corte:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar corte' };
        }
    }
};

export default periodosService;
