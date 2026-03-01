const API_URL = 'http://localhost:3000/api/student/evaluaciones';

export const studentEvaluacionesService = {
    async getEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error');
        return data.data || [];
    },

    async getDetalleEvaluacion(evaluacionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${evaluacionId}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};
