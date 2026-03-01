const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const reportesService = {
    async getAdminStats() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/reportes/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.stats || null;
    }
};
