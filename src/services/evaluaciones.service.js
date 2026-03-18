import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const evaluacionesService = {
    async getEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = response.data;
        if (data.success) return data.evaluaciones;
        throw new Error(data.message || 'Error al cargar evaluaciones');
    },

    async getTeacherEvaluaciones() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data;
        if (data.success) return data.evaluaciones;
        throw new Error(data.message || 'Error al cargar evaluaciones del docente');
    },


    async getCarreras() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/carreras`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data;
    },

    async getMateriasByCarrera(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/carrera/${carreraCodigo}/materias`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data;
    },

    async getSecciones(materiaCodigo, carreraCodigo) {
        const token = localStorage.getItem('token');
        const url = carreraCodigo 
            ? `${API_URL}/evaluaciones/materia/${materiaCodigo}/${carreraCodigo}/secciones`
            : `${API_URL}/evaluaciones/materia/${materiaCodigo}/secciones`;
            
        const response = await axios.get(url, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data;
    },

    async getEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/seccion/${seccionId}/estudiantes`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/rubricas-activas`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    // --- Teacher Specific Methods (Filtered by Permissions) ---
    async getTeacherCarreras() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/carreras`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getTeacherMateriasByCarrera(carreraCodigo) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/carrera/${carreraCodigo}/materias`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getTeacherSecciones(materiaCodigo) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/materia/${materiaCodigo}/secciones`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getTeacherEstudiantes(seccionId) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/seccion/${seccionId}/estudiantes`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getTeacherRubricasActivas() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/rubricas/activas`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async createEvaluaciones(rubrica_id, estudiantes, observaciones) { //DISTINTO
        const token = localStorage.getItem('token');
        const periodo = (JSON.parse(localStorage.getItem('user'))).periodo_usuario
        const response = await fetch(`${API_URL}/teacher/evaluaciones/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rubrica_id, estudiantes, observaciones, periodo })
        });
        return await response.json();
    },

    async getEstrategias() {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/estrategias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getSeccionHorario(seccionId) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/seccion/${seccionId}/horario`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getEvaluacionById(id) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/evaluaciones/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.data;
    },

    async getEvaluacionDetalles(evaluacionId, estudianteCedula) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/detalles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.data
        return data;
    },

    async saveEvaluacionResultado(evaluacionId, estudianteCedula, payload) {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/teacher/evaluaciones/${evaluacionId}/${estudianteCedula}/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        return await response.data;
    },

    async saveEvaluacion(formData, id = null) {
        const token = localStorage.getItem('token');
        let url, method;

        if (id) {
            // Edición del registro de la evaluación
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
