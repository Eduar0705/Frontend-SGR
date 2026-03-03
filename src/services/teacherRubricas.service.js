const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const teacherRubricasService = {
    async getFormData() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/form-data`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json();
        return data.data;
    },

    async getSemestres(carrera) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/semestres/${carrera}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getMaterias(carrera, semestre) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/materias/${carrera}/${semestre}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getSecciones(materia) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/secciones/${materia}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getEvaluaciones(seccionId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/evaluaciones/${seccionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    },

    async crearRubrica(rubricaData) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rubricaData)
        });
        return await res.json();
    },

    async getRubricas() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener rúbricas');
        return await res.json();
    },

    async getRubricaDetalle(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/detalle/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener detalle de la rúbrica');
        return await res.json();
    },

    async getRubricaForEdit(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/editar/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener rúbrica para editar');
        return await res.json();
    },

    async updateRubrica(id, rubricaData) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rubricaData)
        });
        return await res.json();
    },

    async deleteRubrica(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    }
};
