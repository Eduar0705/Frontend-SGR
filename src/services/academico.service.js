const API_URL = 'http://localhost:3000/api';

export const academicoService = {
    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data || [];
    },

    async getSemestres(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/semestres/${carreraCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data || [];
    },

    async getMaterias(carreraCodigo, semestreId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/materias/${carreraCodigo}/${semestreId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data || [];
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/secciones/${materiaCodigo}/${carreraCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data || [];
    },

    async getEvaluaciones(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/admin/evaluaciones/${seccionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async getEvaluacionDetalle(evalId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluacion/${evalId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluacion || null;
    },

    async getEstrategias() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/estrategias_eval`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.estrategias_eval || [];
    },

    async getTiposRubrica() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tipos-rubrica`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data || [];
    },

    async getEvaluacionesDocentes() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluaciones-docentes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async getEvaluacionDocenteDetalle(evalId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluacion-docente/${evalId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data;
    },

    async getPermisosDocente(cedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/permisos-docente/${cedula}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.permisos || null;
    },

    async saveEvaluacionDocente(evalData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluacion-docente/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(evalData)
        });
        return await response.json();
    },

    async updateEvaluacionDocente(evalId, evalData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluacion-docente/actualizar/${evalId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(evalData)
        });
        return await response.json();
    },

    async getRubricas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/rubricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.rubricas || [];
    },

    async getRubricaDetalle(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/rubricas/editar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data;
    },

    async getCarreraMateria(materiaCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/rubricas/carrera-materia/${materiaCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data;
    },

    async getEvaluacionesConRubrica(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/admin/evaluaciones_con_rubrica/${seccionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async updateRubrica(id, rubricaData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubrica/actualizar/${id}`, {
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
        const response = await fetch(`${API_URL}/admin/deleteRubrica/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async saveRubrica(rubricaData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/envioRubrica`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(rubricaData)
        });
        return await response.json();
    }
};
