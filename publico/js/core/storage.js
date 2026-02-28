import { CONFIG } from "./config.js";

export const Storage = {

    getAll() {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveAll(items) {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(items));
    },

    add(item) {
        const items = this.getAll();
        items.push(item);
        this.saveAll(items);
        return item;
    },

    clear() {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    }

};