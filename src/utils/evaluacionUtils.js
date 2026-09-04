/**
 * Utilidades para cálculo y redondeo de evaluaciones en Frontend
 */

/**
 * Si la nota total calculada está a 50 centésimas (0.50) o menos del porcentaje_evaluacion,
 * redondearla para arriba para que llegue a dicho porcentaje.
 * 
 * @param {number|string} puntaje - Puntaje obtenido calculado
 * @param {number|string} porcentajeEvaluacion - Ponderación / puntaje máximo de la evaluación
 * @returns {number} Puntaje con el redondeo aplicado
 */
export function aplicarRedondeoPuntaje(puntaje, porcentajeEvaluacion) {
    const p = parseFloat(puntaje);
    const max = parseFloat(porcentajeEvaluacion);
    if (isNaN(p) || isNaN(max) || max <= 0 || p <= 0) return isNaN(p) ? 0 : p;
    const diff = max - p;
    if (diff > 0 && diff <= 0.50001) {
        return max;
    }
    if (p > max) {
        return max;
    }
    return p;
}

/**
 * Valida la estructura de criterios y niveles para creación y edición de rúbricas.
 * 
 * @param {Object} params
 * @param {Array} params.criterios - Lista de criterios con sus niveles
 * @param {number|string} params.porcentaje - Ponderación total de la evaluación
 * @param {boolean} [params.esCreacion=false] - Indica si es creación o edición
 * @returns {{ valido: boolean, mensaje?: string }}
 */
export function validarEstructuraRubrica({ criterios, porcentaje }) {
    if (!criterios || !Array.isArray(criterios) || criterios.length === 0) {
        return { valido: false, mensaje: 'Debe agregar al menos un criterio de evaluación.' };
    }

    const porcentajeTotal = parseFloat(porcentaje);
    if (isNaN(porcentajeTotal) || porcentajeTotal < 0) {
        return { valido: false, mensaje: 'El porcentaje de la evaluación debe ser mayor a 0.' };
    }

    let sumaPuntajes = 0;
    let sumatoriaMinimos = 0;

    for (let i = 0; i < criterios.length; i++) {
        const crit = criterios[i];
        const critNombre = crit.descripcion?.trim() || `Criterio ${i + 1}`;

        if (!crit.descripcion || crit.descripcion.trim() === '') {
            return { valido: false, mensaje: `El criterio ${i + 1} necesita una descripción.` };
        }

        const puntajeCriterio = parseFloat(crit.puntaje_maximo);
        if (isNaN(puntajeCriterio) || puntajeCriterio <= 0) {
            return { valido: false, mensaje: `El puntaje del criterio "${critNombre}" debe ser mayor a 0.` };
        }
        sumaPuntajes += puntajeCriterio;

        if (!crit.niveles || !Array.isArray(crit.niveles) || crit.niveles.length === 0) {
            return { valido: false, mensaje: `El criterio "${critNombre}" debe tener al menos un nivel de desempeño.` };
        }

        const puntajesNiveles = [];
        let minNivelCriterio = Infinity;

        for (let j = 0; j < crit.niveles.length; j++) {
            const nivel = crit.niveles[j];
            const nombreNivel = nivel.nombre_nivel?.trim() || nivel.nombre?.trim() || '';

            if (!nombreNivel) {
                return { valido: false, mensaje: `El nivel ${j + 1} del criterio "${critNombre}" necesita un nombre.` };
            }

            if (!nivel.descripcion || nivel.descripcion.trim() === '') {
                return { valido: false, mensaje: `El nivel "${nombreNivel}" del criterio "${critNombre}" necesita una descripción.` };
            }

            const pNivel = parseFloat(nivel.puntaje);
            if (isNaN(pNivel) || pNivel < 0) {
                return { valido: false, mensaje: `El puntaje del nivel "${nombreNivel}" en "${critNombre}" no puede ser negativo.` };
            }

            if (pNivel > puntajeCriterio + 0.0001) {
                return { valido: false, mensaje: `El puntaje del nivel "${nombreNivel}" (${pNivel}) excede el puntaje máximo del criterio "${critNombre}" (${puntajeCriterio} pts).` };
            }

            puntajesNiveles.push(pNivel);
            if (pNivel < minNivelCriterio) {
                minNivelCriterio = pNivel;
            }
        }

        // 1. Todos los niveles deben tener puntajes distintos
        const formattedScores = puntajesNiveles.map(p => p.toFixed(4));
        const uniqueScores = new Set(formattedScores);
        if (uniqueScores.size !== puntajesNiveles.length) {
            return { valido: false, mensaje: `En el criterio "${critNombre}", todos los niveles deben tener puntajes distintos.` };
        }

        // 2. Al menos uno de los niveles ha de tener puntaje = puntaje_maximo_del_criterio
        const tieneNivelMaximo = puntajesNiveles.some(p => Math.abs(p - puntajeCriterio) < 0.001);
        if (!tieneNivelMaximo) {
            return { valido: false, mensaje: `En el criterio "${critNombre}", al menos uno de los niveles debe tener un puntaje igual al puntaje máximo del criterio (${puntajeCriterio} pts).` };
        }

        sumatoriaMinimos += (minNivelCriterio === Infinity ? 0 : minNivelCriterio);
    }

    // Validación de suma de criterios vs porcentaje total
    if (Math.abs(sumaPuntajes - porcentajeTotal) > 0.01) {
        return {
            valido: false,
            mensaje: `La suma de puntajes de los criterios (${sumaPuntajes.toFixed(3)}) debe ser igual al porcentaje de la evaluación (${porcentajeTotal}%).`
        };
    }

    // 4. La sumatoria de los criterios más bajos sea mínimo 0,025pts
    if (sumatoriaMinimos < 0.02499) {
        return {
            valido: false,
            mensaje: `La sumatoria de los puntajes más bajos de todos los criterios debe ser como mínimo 0.025 puntos (actual: ${sumatoriaMinimos.toFixed(3)} pts).`
        };
    }

    return { valido: true };
}
