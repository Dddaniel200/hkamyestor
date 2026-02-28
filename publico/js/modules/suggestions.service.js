import { CONFIG } from "../core/config.js";
import { Api } from "../core/api.js";
import { Storage } from "../core/storage.js";

export const SuggestionsService = {
    // Función para obtener los mensajes de MariaDB
    async getAll() {
        if (CONFIG.USE_BACKEND) {
            try {
                const rows = await Api.getSuggestions();
                // Normalizar filas del backend al formato que usa el frontend
                // backend puede devolver { id, nombre, mensaje, fecha }
                return Array.isArray(rows) ? rows.map(r => ({
                    id: r.id ?? r.ID ?? Date.now(),
                    name: r.nombre ?? r.name ?? 'Anónimo',
                    title: r.titulo ?? r.title ?? '',
                    message: r.mensaje ?? r.message ?? '',
                    rating: r.rating ?? 0,
                    createdAt: r.fecha ?? r.createdAt ?? new Date().toISOString()
                })) : [];
            } catch (error) {
                console.error("Error al obtener datos del servidor:", error);
                return Storage.getAll(); // Respaldo local si falla el server
            }
        }
        return Storage.getAll();
    },

    // Función para enviar el nuevo mensaje a MariaDB
    async create(data) {
        if (CONFIG.USE_BACKEND) {
            try {
                // Enviamos 'name' y 'message' que es lo que espera tu MariaDB
                // Incluimos campos adicionales si existen (title, rating)
                return await Api.createSuggestion({
                    name: data.name,
                    message: data.message,
                    title: data.title,
                    rating: data.rating
                });
            } catch (error) {
                console.error("Error al guardar en el servidor:", error);
            }
        }
        
        // Esto siempre guarda una copia local por seguridad
        const suggestion = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date().toISOString()
        };
        return Storage.add(suggestion);
    }
};