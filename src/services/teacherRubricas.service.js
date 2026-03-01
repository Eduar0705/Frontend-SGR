const API_URL = 'http://localhost:3000/api/teacher/rubricas';

export const teacherRubricasService = {
    async getFormData() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/form-data`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener datos');
        const data = await res.json();
        return data.data;
    },

    async getSemestres(carrera) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/semestres/${carrera}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getMaterias(carrera, semestre) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/materias/${carrera}/${semestre}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getSecciones(materia) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/secciones/${materia}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        return data.data;
    },

    async getEvaluaciones(seccionId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/evaluaciones/${seccionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    },

    async crearRubrica(rubricaData) {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
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
        const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener rúbricas');
        return await res.json();
    },

    async getRubricaDetalle(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/detalle/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener detalle de la rúbrica');
        return await res.json();
    },

    async getRubricaForEdit(id) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/editar/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener rúbrica para editar');
        return await res.json();
    },

    async updateRubrica(id, rubricaData) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/${id}`, {
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
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    }
};
