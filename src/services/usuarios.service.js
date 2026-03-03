const API_URL = import.meta.env.VITE_API_URL || 'https://bacsgr.up.railway.app/api';

export const usuariosService = {
    async getUsuarios() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.data || [];
    },

    async createUsuario(usuarioData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(usuarioData)
        });
        return await response.json();
    },

    async updateUsuario(cedulaOriginal, usuarioData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios/${cedulaOriginal}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(usuarioData)
        });
        return await response.json();
    },

    async deleteUsuario(cedula) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/usuarios/${cedula}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await response.json();
    }
};
