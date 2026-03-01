// src/services/dashboard.service.js
const API_URL = 'http://localhost:3000/api';

export const dashboardService = {
    async getStats() {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener estadísticas del dashboard');
        }

        return data.data; // Retorna el payload de data
    },

    async getStudentStats() {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/dashboard/student`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener estadísticas estudiantiles');
        }

        return data.data;
    },

    async getTeacherStats() {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/dashboard/teacher`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al obtener estadísticas del docente');
        }

        return data.data;
    }
};
