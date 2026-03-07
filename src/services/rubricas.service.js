import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

// Crear una instancia de axios con configuración base
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 segundos
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para manejar respuestas
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Token expirado o no válido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Función auxiliar para manejar las peticiones
async function fetchJSON(url, options = {}) {
    const token = localStorage.getItem('token');
    
    // FIX #2: Verificar token primero
    if (!token) {
        throw new Error('No hay sesión activa. Por favor inicie sesión.');
    }

    try {
        // Extraer método y otros parámetros de options
        const { method = 'GET', params = {}, body, headers = {} } = options;
        
        // Configurar la petición
        const config = {
            method,
            url,
            params, // Axios maneja los query params automáticamente
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        // Si hay body, agregarlo (para POST, PUT, etc)
        if (body) {
            config.data = typeof body === 'string' ? JSON.parse(body) : body;
        }

        // Hacer la petición con axios
        const response = await api(config);
        
        // Verificar si la respuesta indica éxito
        if (response.data && response.data.success === false) {
            throw new Error(response.data.message || 'Error en la operación');
        }
        
        return response.data; // Axios ya parsea el JSON automáticamente
        
    } catch (error) {
        // Manejar errores de axios
        if (error.response) {
            // El servidor respondió con un código de error
            const errorMsg = error.response.data?.message || 
                            error.response.data?.mensaje || 
                            `Error ${error.response.status}: ${error.response.statusText}`;
            throw new Error(errorMsg);
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            throw new Error('No se pudo conectar con el servidor');
        } else {
            // Error en la configuración de la petición
            throw error;
        }
    }
}

export const rubricasService = {
    
    async getRubricas() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.periodo_usuario) {
            console.warn('No hay período de usuario disponible');
        }
        
        const response = await fetchJSON(`/rubricas/admin/rubricas`, {
            params: { periodo: user.periodo_usuario }
        });
        
        return Array.isArray(response?.rubricas) ? response.rubricas : [];
    },

    async getHierarchicalData() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return fetchJSON(`/rubricas/hierarchical-data`, {
            params: { periodo: user.periodo_usuario }
        });
    },

    async getTiposRubrica() {
        return fetchJSON(`/rubricas/admin/tipos_rubrica`);
    },

    async getEstrategiasEval() {
        const response = await fetchJSON(`/evaluaciones/estrategias`);
        return Array.isArray(response?.estrategias_eval) ? response.estrategias_eval : [];
    },

    async getRubricaDetalle(id) {
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`/rubricas/admin/rubricas/detalle/${id}`, {
            params: { t: Date.now() } // Evitar caché
        });
    },

    async getRubricaForEdit(id) {
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`/rubricas/admin/rubricas/editar/${id}`);
    },

    async getCarreraXSeccion(idSecc) {
        if (!idSecc) throw new Error('Código de materia requerido');
        return fetchJSON(`/rubricas/admin/rubricas/carrera-seccion/${idSecc}`);
    },

    async getEvaluacionesConRubrica(seccionId) {
        if (!seccionId) throw new Error('ID de sección requerido');
        const response = await fetchJSON(`/rubricas/admin/evaluaciones_con_rubrica/${seccionId}`);
        return Array.isArray(response?.evaluaciones) ? response.evaluaciones : [];
    },

    async updateRubrica(id, rubricaData) {
        if (!id) throw new Error('ID de rúbrica requerido');
        if (!rubricaData || typeof rubricaData !== 'object') throw new Error('Datos de rúbrica inválidos');
        
        return fetchJSON(`/rubricas/rubrica/actualizar/${id}`, {
            method: 'POST',
            body: rubricaData // Axios serializará automáticamente
        });
    },

    async getSemestres(carrera) {
        if (!carrera) throw new Error('Código de carrera requerido');
        return fetchJSON(`/rubricas/semestres/${carrera}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario }
        });
    },

    async getMaterias(carrera, semestre) {
        if (!carrera || !semestre) throw new Error('Carrera y semestre son requeridos');
        return fetchJSON(`/rubricas/materias/${carrera}/${semestre}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario }
        });
    },

    async getSecciones(materia, carrera) {
        if (!materia || !carrera) throw new Error('Materia y carrera son requeridas');
        return fetchJSON(`/rubricas/secciones/${materia}/${carrera}`, {
            params: { periodo: (JSON.parse(localStorage.getItem('user'))).periodo_usuario }
        });
    },

    async getEvaluacionesPendientes(seccionId) {
        if (!seccionId) throw new Error('ID de sección requerido');
        const response = await fetchJSON(`/rubricas/evaluaciones/${seccionId}`);
        return Array.isArray(response?.evaluaciones) ? response.evaluaciones : [];
    },

    async saveRubrica(rubricaData) {
        if (!rubricaData || typeof rubricaData !== 'object') throw new Error('Datos de rúbrica inválidos');
        
        const { nombre_rubrica, id_evaluacion, tipo_rubrica, instrucciones, criterios } = rubricaData;
        if (!nombre_rubrica || !id_evaluacion || !tipo_rubrica || !instrucciones || !criterios) {
            throw new Error('Faltan campos obligatorios');
        }
        
        return fetchJSON(`/rubricas/guardar`, {
            method: 'POST',
            body: rubricaData
        });
    },

    async deleteRubrica(id) {
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`/rubricas/admin/deleteRubrica/${id}`, {
            method: 'DELETE'
        });
    }
};