/**
 * Funciones para comunicarse con la API de YTpro
 */

/**
 * Buscar videos en YouTube
 */
export async function buscarVideos(query, continuarBusqueda = false) {
	const res = await fetch('https://y-tpro.vercel.app/YTpro/YTpro', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			query,
			continuarBusqueda
		})
	});

	if (!res.ok) throw new Error('Error en la petición');

	return await res.json();
}

/**
 * Obtener stream de un video
 */
export async function obtenerStreamVideo(videoId, downloadType = 'video') {
	// console.log(`📡 Solicitando stream: videoId=${videoId}, tipo=${downloadType}`);
	
	try {
		// Agregar timeout de 30 segundos
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000);
		
		const res = await fetch('/YTpro', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ 
				videoId,
				downloadType
			}),
			signal: controller.signal
		});
		
		clearTimeout(timeoutId);

		// console.log(`📡 Respuesta recibida: status=${res.status}`);

		if (!res.ok) {
			const errorText = await res.text();
			console.error(`❌ Error HTTP ${res.status}:`, errorText);
			
			let errorData;
			try {
				errorData = JSON.parse(errorText);
			} catch {
				errorData = { error: errorText };
			}
			
			throw new Error(errorData.error || `Error HTTP ${res.status}`);
		}

		const data = await res.json();
		// console.log('✅ Datos recibidos:', {
		// 	hasStream: !!data.stream,
		// 	streamLength: data.stream?.length,
		// 	quality: data.quality,
		// 	mime: data.mime
		// });
		
		return data;
	} catch (error) {
		if (error.name === 'AbortError') {
			console.error('❌ Timeout: La solicitud tardó más de 30 segundos');
			throw new Error('La solicitud tardó demasiado. Intenta con otro video.');
		}
		
		console.error('❌ Error en obtenerStreamVideo:', error);
		
		// Si es un error de red genérico
		if (error.message === 'Failed to fetch') {
			throw new Error('No se pudo conectar con el servidor. ¿Está corriendo npm run dev?');
		}
		
		throw error;
	}
}

/**
 * Descargar video o audio
 */
export async function descargarMedia(videoId, tipo, titulo) {
	// console.log(`\n🔽 ==========================================`);
	// console.log(`INICIANDO DESCARGA DE ${tipo.toUpperCase()}`);
	// console.log(`Video ID: ${videoId}`);
	// console.log(`Título: ${titulo}`);
	// console.log(`==========================================\n`);
	
	try {
		const data = await obtenerStreamVideo(videoId, tipo);
		
		// console.log('✅ Stream obtenido del servidor:', {
		// 	hasStream: !!data.stream,
		// 	quality: data.quality,
		// 	mime: data.mime,
		// 	isDataUrl: data.stream?.startsWith('data:')
		// });
		
		if (!data.stream) {
			throw new Error('El servidor no devolvió una URL de stream');
		}
		
		// Crear enlace de descarga
		const link = document.createElement('a');
		link.href = data.stream;
		
		// Si es audio (tipo === 'audio'), la extensión depende del contenido
		// YouTube a veces da mp4 con solo audio, o m4a
		let extension;
		if (tipo === 'audio') {
			// YouTube típicamente da audio en formato m4a o mp4
			extension = 'm4a';
		} else {
			extension = 'mp4';
		}
		
		const nombreArchivo = `${titulo.replace(/[^a-z0-9\s]/gi, '_')}_${tipo}.${extension}`;
		link.download = nombreArchivo;
		link.style.display = 'none';
		document.body.appendChild(link);
		
		// console.log('📥 Iniciando descarga del archivo:', nombreArchivo);
		link.click();
		
		// Cleanup
		setTimeout(() => {
			document.body.removeChild(link);
		}, 100);
		
		console.log('✅ Descarga iniciada exitosamente\n');
		return nombreArchivo;
		
	} catch (error) {
		console.error('\n❌ ==========================================');
		console.error('ERROR EN DESCARGA');
		console.error(`Mensaje: ${error.message}`);
		console.error(`Stack:`, error.stack);
		console.error('==========================================\n');
		throw error;
	}
}
