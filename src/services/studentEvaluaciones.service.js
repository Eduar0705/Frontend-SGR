const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const studentEvaluacionesService = {
    async getEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/student/evaluaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error');
        return data.data || [];
    },

    async getDetalleEvaluacion(evaluacionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/student/evaluaciones/${evaluacionId}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};
