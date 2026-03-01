const API_URL = 'http://localhost:3000/api/evaluaciones';

export const evaluacionesService = {
    async getEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.evaluaciones || [];
    },

    async getEvaluacionById(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEstrategias() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/estrategias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/rubricas-activas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getMateriasByCarrera(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/carrera/${carreraCodigo}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/materia/${materiaCodigo}/${carreraCodigo}/secciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSeccionEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/seccion/${seccionId}/estudiantes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSeccionHorario(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/seccion/${seccionId}/horario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async saveEvaluacion(evalData, id = null) {
        const token = localStorage.getItem('token');
        const url = id ? `${API_URL}/${id}` : `${API_URL}/crear`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(evalData)
        });
        return await response.json();
    }
};
