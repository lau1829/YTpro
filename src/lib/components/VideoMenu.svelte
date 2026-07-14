<script>
	import { descargarMedia } from '$lib/utils/api.js';
	import { mostrarNotificacion, mostrarLoader } from '$lib/utils/notifications.js';
	import { compartirVideo } from '$lib/utils/compartir.js';
	import { agregarACola, seleccionarSugerencia } from '$lib/utils/eventos.js';

	let { video } = $props();
	let menuAbierto = $state(false);

	function toggleMenu(e) {
		e.stopPropagation();
		menuAbierto = !menuAbierto;
	}

	function cerrarMenu() {
		menuAbierto = false;
	}

	async function descargar(e) {
		e.stopPropagation();
		cerrarMenu();
		
		const loader = mostrarLoader('Preparando descarga...');

		try {
			// Solo descargar video (no audio, el navegador lo bloquea)
			const nombreArchivo = await descargarMedia(video.id, 'video', video.title);
			loader.cambiarATipo('✓ Descarga iniciada', 'success');
		} catch (error) {
			console.error('❌ Error al descargar:', error);
			loader.cambiarATipo(`Error: ${error.message}`, 'error');
		}
	}

	async function compartir(e) {
		e.stopPropagation();
		cerrarMenu();
		
		try {
			const resultado = await compartirVideo(video.id, video.title);
			
			if (resultado === true) {
				return;
			} else if (typeof resultado === 'string') {
				mostrarNotificacion('✓ Enlace copiado al portapapeles', 'success');
			}
		} catch (error) {
			mostrarNotificacion('Error al compartir', 'error');
		}
	}

	function abrirVideo(e) {
		e.stopPropagation();
		cerrarMenu();
		seleccionarSugerencia(video);
	}

	function agregarAFila(e) {
		e.stopPropagation();
		cerrarMenu();
		agregarACola(video);
		mostrarNotificacion('✓ Agregado a la cola', 'success');
	}

	function handleClickOutside(e) {
		if (menuAbierto && !e.target.closest('.menu-container')) {
			cerrarMenu();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="menu-container relative">
	<button
		onclick={toggleMenu}
		class="p-1.5 hover:bg-zinc-800 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
		aria-label="Menú de opciones"
	>
		<svg class="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
			<circle cx="12" cy="5" r="2"/>
			<circle cx="12" cy="12" r="2"/>
			<circle cx="12" cy="19" r="2"/>
		</svg>
	</button>

	{#if menuAbierto}
		<div class="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
			<div class="animate-slide-in">
				<button
					onclick={descargar}
					class="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-3"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
					</svg>
					Descargar Video
				</button>

				<button
					onclick={compartir}
					class="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-3"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
					</svg>
					Compartir
				</button>

				<button
					onclick={abrirVideo}
					class="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-3"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					Reproducir Video
				</button>

				<button
					onclick={agregarAFila}
					class="w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-3 border-t border-zinc-800"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
					</svg>
					Agregar a la Cola
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	:global(.animate-fade-in) {
		animation: fade-in 0.3s ease-out;
	}
</style>
