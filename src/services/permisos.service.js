import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const permisosService = {
    async getPermisosByDocente(cedula) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/permisos/docente/${cedula}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async createPermiso(docente_cedula, seccion_id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/permisos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ docente_cedula, seccion_id })
        });
        return await response.json();
    },

    async deletePermiso(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/permisos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    // Auxiliares académicos para el formulario de permisos
    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSemestres(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/semestres/${carreraCodigo}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getMaterias(carreraCodigo, semestreId) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/materias/${carreraCodigo}/${semestreId}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/secciones/${materiaCodigo}/${carreraCodigo}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    }
};
