const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const rubricasService = {
    async getRubricas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/rubricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.rubricas || [];
    },

    async getHierarchicalData() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/hierarchical-data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getTiposRubrica() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/tipos_rubrica/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEstrategiasEval() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/estrategias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.estrategias_eval || [];
    },

    async getRubricaDetalle(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/rubricas/detalle/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getRubricaForEdit(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/rubricas/editar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getCarreraMateria(materiaCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/rubricas/carrera-materia/${materiaCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEvaluacionesConRubrica(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/evaluaciones_con_rubrica/${seccionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async updateRubrica(id, rubricaData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/rubrica/actualizar/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rubricaData)
        });
        return await response.json();
    },

    async getSemestres(carrera) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/semestres/${carrera}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getMaterias(carrera, semestre) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/materias/${carrera}/${semestre}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSecciones(materia, carrera) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/secciones/${materia}/${carrera}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEvaluacionesPendientes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/evaluaciones/${seccionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async saveRubrica(rubricaData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rubricaData)
        });
        return await response.json();
    },

    async deleteRubrica(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas/admin/deleteRubrica/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
}
