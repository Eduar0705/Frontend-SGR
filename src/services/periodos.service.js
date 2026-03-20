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

    getPensums: async () => {
        try {
            const response = await axios.get(`${API_URL}/periodos/pensums`, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching pensums:', error);
            return { success: false, data: [] };
        }
    },

    createPeriodo: async (data) => {
        try {
            const response = await axios.post(`${API_URL}/periodos/crear`, data, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating periodo:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al crear periodo' };
        }
    },

    deletePeriodo: async (codigoPeriodo) => {
        try {
            const response = await axios.delete(`${API_URL}/periodos/delete/${codigoPeriodo}`, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error deleting periodo:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar periodo' };
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
    },

    getLapsosByPeriodo: async (codigoPeriodo) => {
        try {
            const response = await axios.get(`${API_URL}/periodos/lapsos/`, {
                params: { periodo: codigoPeriodo },
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching lapsos:', error);
            return { success: false, data: [] };
        }
    },

    createLapso: async (data) => {
        try {
            const response = await axios.post(`${API_URL}/periodos/lapsos/crear`, data, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating lapso:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al crear lapso' };
        }
    },

    updateLapso: async (id, data) => {
        try {
            const response = await axios.put(`${API_URL}/periodos/lapsos/update/${id}`, data, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating lapso:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al actualizar lapso' };
        }
    },

    deleteLapso: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/periodos/lapsos/delete/${id}`, {
                headers: getAuthHeaders()
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error deleting lapso:', error);
            return { success: false, mensaje: error.response?.data?.mensaje || 'Error al eliminar lapso' };
        }
    }
};

export default periodosService;
