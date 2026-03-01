const API_URL = 'http://127.0.0.1:3000/api/teacher/students';

export const estudiantesService = {
    getEstudiantes: async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al obtener estudiantes');
            return await res.json();
        } catch (error) {
            console.error('Error in getEstudiantes service:', error);
            throw error;
        }
    },

    getEstudianteByCedula: async (cedula) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/${cedula}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al obtener detalle del estudiante');
            return await res.json();
        } catch (error) {
            console.error('Error in getEstudianteByCedula service:', error);
            throw error;
        }
    }
};
