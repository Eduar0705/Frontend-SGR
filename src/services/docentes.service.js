// src/services/docentes.service.js
const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const docentesService = {
    async getDocentes() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/docentes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data; // Retorna el array de profesores
    },

    async saveDocente(docenteData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/docentes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(docenteData)
        });
        return await response.json();
    },

    async updateDocente(cedula_og, docenteData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/docentes/${cedula_og}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(docenteData)
        });
        return await response.json();
    },

    async deleteDocente(cedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/docentes/${cedula}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};