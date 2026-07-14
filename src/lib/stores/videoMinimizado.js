/**
 * Store para mantener el estado del video minimizado global
 */
import { writable } from 'svelte/store';

function crearStoreVideoMinimizado() {
	const { subscribe, set, update } = writable({
		activo: false,
		videoId: null,
		url: null,
		poster: null,
		titulo: null,
		currentTime: 0, // Guardar tiempo actual del video
		playing: false // Guardar si estaba reproduciendo
	});

	return {
		subscribe,
		minimizar: (videoId, url, poster, titulo, currentTime = 0, playing = false) => {
			set({
				activo: true,
				videoId,
				url,
				poster,
				titulo,
				currentTime,
				playing
			});
		},
		cerrar: () => {
			set({
				activo: false,
				videoId: null,
				url: null,
				poster: null,
				titulo: null,
				currentTime: 0,
				playing: false
			});
		},
		restaurar: () => {
			update(state => ({ ...state, activo: false }));
		},
		updateTime: (currentTime, playing) => {
			update(state => ({ ...state, currentTime, playing }));
		}
	};
}

export const videoMinimizado = crearStoreVideoMinimizado();
