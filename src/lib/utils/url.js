/**
 * Utilidades para manejo de URLs y parámetros
 */

export function obtenerParametros() {
	const params = new URLSearchParams(window.location.search);
	return {
		busqueda: params.get('q'),
		videoId: params.get('v')
	};
}

export function actualizarParametroBusqueda(busqueda) {
	const params = new URLSearchParams(window.location.search);
	params.set('q', busqueda);
	return params.toString();
}

export function actualizarParametroVideo(videoId) {
	const params = new URLSearchParams(window.location.search);
	params.set('v', videoId);
	return params.toString();
}

export function eliminarParametroVideo() {
	const params = new URLSearchParams(window.location.search);
	params.delete('v');
	return params.toString() ? `?${params.toString()}` : window.location.pathname;
}

export function construirUrlCompartir(videoId) {
	const params = new URLSearchParams(window.location.search);
	params.set('v', videoId);
	return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}
