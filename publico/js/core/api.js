// Asegúrate de que tu Api.js sea exactamente así
const BASE_URL = 'http://localhost:3000/api';

export const Api = {
    async getSuggestions() {
        const response = await fetch(`${BASE_URL}/sugerencias`);
        return await response.json();
    },

    async createSuggestion(data) {
        // Esta es la parte que envía a MariaDB
        const response = await fetch(`${BASE_URL}/sugerencias`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
};