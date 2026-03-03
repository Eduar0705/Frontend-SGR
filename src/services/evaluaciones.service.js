const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const evaluacionesService = {
    async getEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) return data.evaluaciones;
        throw new Error(data.message || 'Error al cargar evaluaciones');
    },

    async getTeacherEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) return data.evaluaciones;
        throw new Error(data.message || 'Error al cargar evaluaciones del docente');
    },

    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getMateriasByCarrera(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/carrera/${carreraCodigo}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        // Usamos la ruta más completa que requiere ambos parámetros si está disponible
        const url = carreraCodigo 
            ? `${API_URL}/evaluaciones/materia/${materiaCodigo}/${carreraCodigo}/secciones`
            : `${API_URL}/evaluaciones/materia/${materiaCodigo}/secciones`;
            
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/seccion/${seccionId}/estudiantes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/rubricas-activas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    // --- Teacher Specific Methods (Filtered by Permissions) ---
    async getTeacherCarreras() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/carreras`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getTeacherMateriasByCarrera(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/carrera/${carreraCodigo}/materias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getTeacherSecciones(materiaCodigo) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/materia/${materiaCodigo}/secciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getTeacherEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/seccion/${seccionId}/estudiantes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getTeacherRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/rubricas/activas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
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

    async getEstrategias() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/estrategias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getSeccionHorario(seccionId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/seccion/${seccionId}/horario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEvaluacionById(id) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/evaluaciones/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async getEvaluacionDetalles(evaluacionId, estudianteCedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    },

    async saveEvaluacionResultado(evaluacionId, estudianteCedula, payload) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        return await response.json();
    },

    async saveEvaluacion(formData, id = null) {
        const token = localStorage.getItem('token');
        let url, method;

        if (id) {
            // Edición de la DEFINICIÓN de la evaluación (Admin/Teacher)
            url = `${API_URL}/evaluaciones/${id}`;
            method = 'PUT';
        } else {
            // Creación de NUEVA evaluación
            url = `${API_URL}/evaluaciones/crear`;
            method = 'POST';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        return await response.json();
    }
};
