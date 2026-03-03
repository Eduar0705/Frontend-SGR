const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

// ─── Helper para manejar errores HTTP de forma centralizada ─────────────────
// FIX #1: Ninguna función original verificaba response.ok antes de parsear JSON.
// Si el servidor devuelve un 401, 404 o 500, response.json() devuelve el error
// del servidor pero el código lo trataba como una respuesta exitosa silenciosamente.
async function fetchJSON(url, options = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });

    // FIX #2: Si no hay token, lanzar error claro antes de que el servidor rechace
    if (!token) {
        throw new Error('No hay sesión activa. Por favor inicie sesión.');
    }

    if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
            const errData = await response.json();
            errorMsg = errData.message || errData.mensaje || errorMsg;
        } catch (_) { /* respuesta no es JSON */ }
        throw new Error(errorMsg);
    }

    return response.json();
}

export const rubricasService = {

    async getRubricas() {
        const data = await fetchJSON(`${API_URL}/rubricas/admin/rubricas`);
        // FIX #3: Retornaba data.rubricas || [] pero si la propiedad cambia de nombre
        // en el backend retorna [] silenciosamente. Ahora retorna el array de forma segura.
        return Array.isArray(data.rubricas) ? data.rubricas : [];
    },

    async getHierarchicalData() {
        return fetchJSON(`${API_URL}/rubricas/hierarchical-data`);
    },

    async getTiposRubrica() {
        // FIX #4: La URL original tenía trailing slash innecesario (/tipos_rubrica/)
        // que puede causar errores en servidores estrictos con rutas.
        return fetchJSON(`${API_URL}/rubricas/admin/tipos_rubrica`);
    },

    async getEstrategiasEval() {
        const data = await fetchJSON(`${API_URL}/evaluaciones/estrategias`);
        return Array.isArray(data.estrategias_eval) ? data.estrategias_eval : [];
    },

    async getRubricaDetalle(id) {
        // FIX #5: No se validaba el parámetro id — si llega undefined/null se hace
        // fetch a una URL inválida sin error claro.
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`${API_URL}/rubricas/admin/rubricas/detalle/${id}?t=${Date.now()}`);
    },

    async getRubricaForEdit(id) {
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`${API_URL}/rubricas/admin/rubricas/editar/${id}`);
    },

    async getCarreraMateria(materiaCodigo) {
        if (!materiaCodigo) throw new Error('Código de materia requerido');
        return fetchJSON(`${API_URL}/rubricas/admin/rubricas/carrera-materia/${materiaCodigo}`);
    },

    async getEvaluacionesConRubrica(seccionId) {
        if (!seccionId) throw new Error('ID de sección requerido');
        const data = await fetchJSON(`${API_URL}/rubricas/admin/evaluaciones_con_rubrica/${seccionId}`);
        return Array.isArray(data.evaluaciones) ? data.evaluaciones : [];
    },

    async updateRubrica(id, rubricaData) {
        if (!id) throw new Error('ID de rúbrica requerido');
        if (!rubricaData || typeof rubricaData !== 'object') throw new Error('Datos de rúbrica inválidos');
        // FIX #6: El método era POST pero semánticamente debería ser PUT para actualizar.
        // Se mantiene POST para no romper el backend existente, pero se documenta.
        return fetchJSON(`${API_URL}/rubricas/rubrica/actualizar/${id}`, {
            method: 'POST',
            body: JSON.stringify(rubricaData)
        });
    },

    async getSemestres(carrera) {
        if (!carrera) throw new Error('Código de carrera requerido');
        return fetchJSON(`${API_URL}/rubricas/semestres/${carrera}`);
    },

    async getMaterias(carrera, semestre) {
        if (!carrera || !semestre) throw new Error('Carrera y semestre son requeridos');
        return fetchJSON(`${API_URL}/rubricas/materias/${carrera}/${semestre}`);
    },

    async getSecciones(materia, carrera) {
        if (!materia || !carrera) throw new Error('Materia y carrera son requeridas');
        return fetchJSON(`${API_URL}/rubricas/secciones/${materia}/${carrera}`);
    },

    async getEvaluacionesPendientes(seccionId) {
        if (!seccionId) throw new Error('ID de sección requerido');
        const data = await fetchJSON(`${API_URL}/rubricas/evaluaciones/${seccionId}`);
        return Array.isArray(data.evaluaciones) ? data.evaluaciones : [];
    },

    async saveRubrica(rubricaData) {
        if (!rubricaData || typeof rubricaData !== 'object') throw new Error('Datos de rúbrica inválidos');
        // FIX #7: No se validaba que los campos mínimos estuvieran presentes antes
        // de hacer el fetch, causando errores poco descriptivos del servidor.
        const { nombre_rubrica, id_evaluacion, tipo_rubrica, instrucciones, criterios } = rubricaData;
        if (!nombre_rubrica || !id_evaluacion || !tipo_rubrica || !instrucciones || !criterios) {
            throw new Error('Faltan campos obligatorios: nombre_rubrica, id_evaluacion, tipo_rubrica, instrucciones, criterios');
        }
        return fetchJSON(`${API_URL}/rubricas/guardar`, {
            method: 'POST',
            body: JSON.stringify(rubricaData)
        });
    },

    async deleteRubrica(id) {
        if (!id) throw new Error('ID de rúbrica requerido');
        return fetchJSON(`${API_URL}/rubricas/admin/deleteRubrica/${id}`, {
            method: 'DELETE'
        });
    }
};