// js/core/api.js corregido
const BASE_URL = '/api'; // Quitamos localhost para que funcione en Render

export const Api = {
    async getSuggestions() {
        const response = await fetch(`${BASE_URL}/sugerencias`);
        return await response.json();
    },

    async createSuggestion(data) {
        const response = await fetch(`${BASE_URL}/sugerencias`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    },

    // Agregué esta función que te faltaba para los productos de la tienda
    async getProducts() {
        const response = await fetch(`${BASE_URL}/productos`);
        return await response.json();
    }
};
