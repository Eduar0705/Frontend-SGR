const API_URL = 'http://localhost:3000/api';

export const authService = {
    login: async (cedula, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cedula, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error en la autenticación');
        }

        return data;
    }
};
