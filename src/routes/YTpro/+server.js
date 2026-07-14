import { json } from "@sveltejs/kit";
import { Innertube } from 'youtubei.js';

// Instancia de Innertube cacheada: se crea una sola vez y se reutiliza en todos los requests.
// Recrearla en cada request es la principal fuente de lentitud.
let ytInstance = null;
async function getYT() {
	if (!ytInstance) {
		ytInstance = await Innertube.create();
	}
	return ytInstance;
}

// Cache en memoria: guardamos el objeto Feed por query para poder llamar getContinuation()
const feedCache = new Map(); // key: query, value: Feed object

export async function POST({ request }) {
	const body = await request.json();
	const { query, continuarBusqueda, videoId, downloadType, isShorts, channelId } = body;

	console.log('📨 Request recibido:', { query, continuarBusqueda, videoId, downloadType, isShorts, channelId });

	// Si se solicita información del canal
	if (channelId) {
		try {
			const yt = await getYT();
			const channel = await yt.getChannel(channelId);
			const videosTab = await channel.getVideos();
			const videos = processVideos(videosTab.videos || []);

			return json({
				title: channel.metadata.title || '',
				avatar: channel.metadata.avatar?.[0]?.url || '',
				banner: channel.metadata.banner?.[0]?.url || '',
				subscribers: channel.metadata.subscriber_count?.text || '',
				videos
			});
		} catch (error) {
			console.error('❌ Error al obtener canal:', error);
			return json({ error: 'Error al obtener el canal de YouTube: ' + error.message }, { status: 500 });
		}
	}

	// Si se solicita el stream directo de un video específico
	if (videoId) {
		try {
			let stream;
			if (downloadType === 'audio') {
				stream = await getAudioOnlyStream(videoId);
			} else {
				stream = await getDirectStreamUrl(videoId);
			}
			
			if (!stream) {
				console.error('❌ Stream es null o undefined');
				return json({ error: 'No se pudo obtener el stream para este video' }, { status: 404 });
			}
			
			return json({
				stream: stream.url,
				quality: stream.quality,
				mime: stream.mime
			});
		} catch (error) {
			return json({ error: 'Error al obtener el stream de YouTube: ' + error.message }, { status: 500 });
		}
	}

	if (!query && !isShorts) {
		return json({ error: 'Se requiere un query, videoId o isShorts' }, { status: 400 });
	}

	try {
		const yt = await getYT();
		let feed;
		const queryFinal = isShorts ? (query ? `${query} shorts` : 'shorts trends') : query;

		if (continuarBusqueda && feedCache.has(queryFinal)) {
			// Tenemos el Feed cacheado — pedimos la siguiente página
			const cachedFeed = feedCache.get(queryFinal);
			if (!cachedFeed.has_continuation) {
				return json({ videos: [], hasMas: false });
			}
			feed = await cachedFeed.getContinuation();
		} else {
			// Búsqueda nueva
			feed = await yt.search(queryFinal, {
				sort_by: 'relevance',
				type: 'all' // Traemos canales, playlists, reels, videos
			});
		}

		// Guardamos el Feed actual en cache para la próxima continuación
		feedCache.set(queryFinal, feed);

		const videos = processVideos(feed.videos || []);
		const hasMas = feed.has_continuation;

		return json({ videos, hasMas });
	} catch (error) {
		return json({ error: 'Error al buscar en YouTube: ' + error.message }, { status: 500 });
	}
}

// ============================================================================
// FUNCIONES
// ============================================================================

/**
 * Procesa una lista de videos de youtubei.js para extraer la metadata.
 */
function processVideos(items) {
	return items
		.filter(item => item && item.id) // descartar items sin ID
		.map((item) => {
			const type = item.type; // 'Video' | 'Short' | 'Playlist' | 'Channel' | ...

			if (type === 'Channel') {
				return {
					type,
					id: item.id,
					title: item.author?.name || item.name?.toString() || '',
					thumbnail: item.author?.best_thumbnail?.url || item.thumbnails?.[0]?.url || '',
					subscribers: item.subscriber_count?.text || item.author?.subscriber_count?.text || '',
					videoCount: item.video_count?.toString() || '',
					verified: item.author?.is_verified || false,
					raw: item
				};
			}

			if (type === 'Playlist') {
				return {
					type,
					id: item.id,
					title: item.title?.toString() || '',
					thumbnail: item.thumbnails?.[0]?.url || item.thumbnail?.[0]?.url || '',
					channel: item.author?.name || '',
					videoCount: item.video_count?.toString() || item.video_count_short?.text || '',
					raw: item
				};
			}

			// Video o Short
			return {
				type,
				id: item.id,
				title: item.title?.toString() || '',
				channel: item.author?.name || '',
				duration: item.duration?.seconds ?? 0,
				views: item.view_count?.toString() || item.short_view_count?.text || '',
				thumbnail: item.thumbnails?.[0]?.url || '',
				url: item.id ? `https://www.youtube.com/watch?v=${item.id}` : null,
				stream: null,
				quality: null,
				mime: null,
				raw: item
			};
		});
}

/**
 * Obtiene la URL directa de streaming de un video de YouTube.
 */
async function getDirectStreamUrl(videoId) {
    try {
        console.log('📹 Iniciando getDirectStreamUrl...');
        const yt = await getYT();
        
        const info = await yt.getInfo(videoId, { client: 'ANDROID' });
        
        // Intenta buscar el mejor formato que ya combina video y audio
        let format = info.chooseFormat({
            type: 'video+audio',
            quality: 'best'
        });
        
        // Si no lo encuentra (común en Shorts), busca el mejor video y el mejor audio por separado
        if (!format) {
            console.log('⚠️ No se encontró formato video+audio. Buscando por separado (adaptativo)...');
            const videoFormat = info.chooseFormat({ type: 'video', quality: 'best' });
            const audioFormat = info.chooseFormat({ type: 'audio', quality: 'best' });

            if (!videoFormat || !audioFormat) {
                throw new Error('No se encontraron formatos de video/audio adaptativos reproducibles.');
            }
            // Usamos el formato de video y le añadimos la URL del audio.
            // El reproductor web moderno puede manejar esto.
            format = videoFormat;
            format.audio_url = (await audioFormat.decipher(yt.session.player));
        }
        
        const streamUrl = await format.decipher(yt.session.player);
        
        // console.log('✅ URL descifrada exitosamente');
        
        return {
            url: streamUrl,
            quality: format.quality_label || 'unknown',
            fps: format.fps || 30,
            mime: format.mime_type || 'video/mp4',
            audio_url: format.audio_url || null // Se añade la URL del audio si existe
        };
    } catch (error) {
        console.error(`❌ Error en getDirectStreamUrl:`, error.message);
        console.error('Stack:', error.stack);
        return null;
    }
}

/**
 * Obtiene stream de "audio" 
 * En realidad, YouTube no proporciona audio puro fácilmente sin autenticación compleja.
 * Estrategia: devolver la URL del video completo (que SÍ funciona con Innertube)
 * y el cliente lo descarga con extensión .m4a
 * 
 * El archivo contendrá video+audio, pero:
 * 1. El usuario puede renombrarlo y extraer audio con cualquier herramienta
 * 2. Muchos reproductores de audio reproducen .m4a aunque tenga video
 * 3. Es la única forma que funciona sin autenticación compleja
 */
async function getAudioOnlyStream(videoId) {
    try {

        // console.log('🎵 Iniciando obtención de "audio" (video+audio)...');
        // console.log('ℹ️  YouTube requiere autenticación compleja para audio puro.');
        // console.log('ℹ️  Devolviendo video completo que el usuario puede convertir.');
        
        // Usar el mismo método que funciona para video
        const yt = await getYT();
        // console.log('📡 Obteniendo info del video con cliente ANDROID...');
        const info = await yt.getInfo(videoId, { client: 'ANDROID' });
        
        // console.log('🔍 Buscando mejor formato video+audio...');
        const format = info.chooseFormat({
            type: 'video+audio',
            quality: 'best'
        });
        
        if (!format) {
            // throw new Error('No se encontró un formato reproducible');
        }
        
        // console.log(`📦 Formato encontrado: ${format.mime_type}`);
        // console.log('🔐 Descifrando URL...');
        
        const streamUrl = await format.decipher(yt.session.player);
        
        // console.log('✅ URL descifrada exitosamente');
        // console.log('💡 Archivo incluirá video+audio (usuario puede extraer audio después)');
        
        return {
            url: streamUrl,
            quality: format.quality_label || 'best',
            mime: format.mime_type || 'video/mp4',
        };
        
    } catch (error) {
        console.error(`❌ Error obteniendo stream de ${videoId}:`, error.message);
        console.error('Stack:', error.stack);
        return null;
    }
}
