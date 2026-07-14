/**
 * Store para manejar un único reproductor global que se mueve entre vistas
 * Esto permite transiciones fluidas sin interrumpir el audio/video
 */
import { writable } from 'svelte/store';

function crearReproductorGlobal() {
	const { subscribe, set, update } = writable({
		videoElement: null,
		activo: false,
		videoId: null,
		url: null,
		poster: null,
		titulo: null,
		modo: 'normal' // 'normal' | 'flotante'
	});

	return {
		subscribe,
		setElement: (element) => {
			update(state => ({ ...state, videoElement: element }));
		},
		setVideo: (videoId, url, poster, titulo) => {
			update(state => ({
				...state,
				activo: true,
				videoId,
				url,
				poster,
				titulo,
				modo: 'normal'
			}));
		},
		setModo: (modo) => {
			update(state => ({ ...state, modo }));
		},
		cerrar: () => {
			set({
				videoElement: null,
				activo: false,
				videoId: null,
				url: null,
				poster: null,
				titulo: null,
				modo: 'normal'
			});
		}
	};
}

export const reproductorGlobal = crearReproductorGlobal();
