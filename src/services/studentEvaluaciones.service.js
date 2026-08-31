const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';
import axios from 'axios';
export const studentEvaluacionesService = {
    async getEvaluaciones(periodo_select) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log(periodo_select!=null ? periodo_select : user.periodo_usuario)
        const response = await axios.get(`${API_URL}/student/evaluaciones`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { periodo: (periodo_select!=null ? periodo_select : user.periodo_usuario)}
        });
        const data = await response.data;
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
