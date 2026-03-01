// js/modules/suggestions.service.js corregido
import { CONFIG } from "../core/config.js";
import { Api } from "../core/api.js";
import { Storage } from "../core/storage.js";

export const SuggestionsService = {
    async getAll() {
        if (CONFIG.USE_BACKEND) {
            try {
                const rows = await Api.getSuggestions();
                return Array.isArray(rows) ? rows.map(r => ({
                    id: r.id || r.ID || Date.now(),
                    name: r.nombre || r.name || 'Anónimo',
                    title: r.titulo || r.title || '',
                    message: r.mensaje || r.message || '',
                    rating: r.importancia || r.rating || 0,
                    createdAt: r.fecha || r.createdAt || new Date().toISOString()
                })) : [];
            } catch (error) {
                console.error("Error al obtener datos del servidor:", error);
                return Storage.getAll();
            }
        }
        return Storage.getAll();
    },

    async create(data) {
        if (CONFIG.USE_BACKEND) {
            try {
                // Ajustado para coincidir con las columnas de tu MariaDB en Aiven
                return await Api.createSuggestion({
                    nombre: data.name,
                    mensaje: data.message,
                    titulo: data.title || '',
                    importancia: data.rating || 0
                });
            } catch (error) {
                console.error("Error al guardar en el servidor:", error);
            }
        }
        
        const suggestion = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        };
        return Storage.add(suggestion);
    }
};
