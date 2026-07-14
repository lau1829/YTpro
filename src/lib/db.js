import {writable,get} from "svelte/store"
import { browser } from '$app/environment'; // Importación clave de SvelteKit

export function $(key, initialValue) {
    // 1. Si estamos en el navegador, intentamos leer; si no, usamos el valor inicial
    const storedValue = browser ? localStorage.getItem(key) : null;
    const data = storedValue ? JSON.parse(storedValue) : initialValue;
    
    const store = writable(data);
    
    // 2. Solo nos suscribimos para escribir si estamos en el navegador
    if (browser) {
        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }
    
    return store;
}