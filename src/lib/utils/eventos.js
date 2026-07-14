/**
 * Sistema de eventos personalizados de la aplicación
 */

import { goto } from '$app/navigation';

export function agregarACola(video) {
	window.dispatchEvent(new CustomEvent('agregarACola', { 
		detail: video 
	}));
}

export function seleccionarSugerencia(video) {
	// Navegar directamente a la página del video
	goto(`/watch/${video.id}`);
}

export function escucharEvento(nombre, callback) {
	window.addEventListener(nombre, callback);
	
	// Retornar función para limpiar el listener
	return () => {
		window.removeEventListener(nombre, callback);
	};
}
