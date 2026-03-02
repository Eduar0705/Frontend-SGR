const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const permisosService = {
    async getPermisosByDocente(cedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/permisos/docente/${cedula}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
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
        const response = await fetch(`${API_URL}/admin/semestres/${carreraCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getMaterias(carreraCodigo, semestreId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/materias/${carreraCodigo}/${semestreId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/secciones/${materiaCodigo}/${carreraCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};
