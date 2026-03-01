const API_URL = 'http://localhost:3000/api';

export const evaluacionesService = {
    async getTeacherEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.carreras || [];
    },

    async getMaterias(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/carrera/${carreraCodigo}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.materias || [];
    },

    async getSecciones(materiaCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/materia/${materiaCodigo}/secciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.secciones || [];
    },

    async getEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/seccion/${seccionId}/estudiantes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.estudiantes || [];
    },

    async getRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/rubricas/activas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.rubricas || [];
    },

    async createEvaluaciones(rubrica_id, estudiantes, observaciones) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rubrica_id, estudiantes, observaciones })
        });
        return await response.json();
    },

    async getDetalles(evaluacionId, estudianteCedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async saveEvaluacion(evaluacionId, estudianteCedula, data) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};
