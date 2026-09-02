
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
        let periodo = '';
            const user = JSON.parse(localStorage.getItem('user'));
            periodo = user?.periodo_usuario || '';
        const res = await fetch(`${API_URL}/teacher/rubricas/semestres/${carrera}?periodo=${periodo}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
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
        return data.evaluaciones || [];
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

    async getRubricas({ search = '', page = 1, limit = 10, modo = 'mis' } = {}) {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({ search, page, limit, modo });
        const res = await fetch(`${API_URL}/teacher/rubricas?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error al obtener rúbricas');
        const data = await res.json();
        return {
            rubricas: Array.isArray(data?.rubricas) ? data.rubricas : [],
            total: data?.total || 0,
            page: data?.page || 1,
            totalPages: data?.totalPages || 1
        };
    },

    async getRubricaDetalle(id, id_eval) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/detalle/${id}/${id_eval}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Error al obtener detalle de la rúbrica');
        return await res.json();
    },

    async getRubricaForEdit(id, id_eval) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/editar/${id}/${id_eval}`, { headers: { 'Authorization': `Bearer ${token}` } });
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
    async vincularRubrica(id, id_eval) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/link/${id}/${id_eval}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    },
    async desvincularRubrica(id, id_eval) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/teacher/rubricas/unlink/${id}/${id_eval}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    }
};
