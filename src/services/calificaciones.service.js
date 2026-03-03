const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const calificacionesService = {
    async getCalificaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/calificaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error al obtener calificaciones');
        return data.data;
    }
};
