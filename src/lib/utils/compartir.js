/**
 * Funciones para compartir contenido
 */

export async function compartirVideo(videoId, titulo) {
	const params = new URLSearchParams(window.location.search);
	params.set('v', videoId);
	const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
	
	if (navigator.share) {
		try {
			await navigator.share({
				title: titulo,
				text: `Mira este video: ${titulo}`,
				url: shareUrl
			});
			return true;
		} catch (err) {
			console.log('Error al compartir:', err);
			return false;
		}
	} else {
		// Fallback: copiar al portapapeles
		try {
			await navigator.clipboard.writeText(shareUrl);
			return shareUrl;
		} catch (err) {
			console.error('Error al copiar:', err);
			throw new Error('No se pudo copiar al portapapeles');
		}
	}
}
