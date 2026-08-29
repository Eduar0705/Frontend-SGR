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
