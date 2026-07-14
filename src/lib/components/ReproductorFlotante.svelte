<script>
	import { videoMinimizado } from '$lib/stores/videoMinimizado.js';

	let state = $state({ activo: false });
	let contenedor = $state(null);
	let videoEl = $state(null);
	let barraEl = $state(null);

	// --- Arrastre de la ventana flotante ---
	let isDragging = $state(false);
	let hasMoved = $state(false);
	let pos = $state({ x: null, y: null });
	let offset = { x: 0, y: 0 };

	// --- Estado del reproductor ---
	let mostrarControles = $state(false);
	let reproduciendo = $state(false);
	let tiempoActual = $state(0);
	let duracion = $state(0);
	let silenciado = $state(false);
	let arrastrandoProgreso = $state(false);
	let cargando = $state(true);

	let streamListo = $derived(state.activo && !!state.url);
	let progreso = $derived(duracion > 0 ? (tiempoActual / duracion) * 100 : 0);

	videoMinimizado.subscribe((newState) => {
		const eraActivo = state?.activo;
		state = newState;
		// Resetear posición y estado solo cuando se activa por primera vez
		if (newState.activo && !eraActivo) {
			pos = { x: null, y: null };
			hasMoved = false;
			reproduciendo = false;
			tiempoActual = newState.currentTime || 0;
			duracion = 0;
			cargando = true;
		}
	});

	function handleTimeUpdate(currentTime, playing) {
		videoMinimizado.updateTime(currentTime, playing);
	}

	function cerrar(e) {
		e?.stopPropagation();
		if (videoEl) videoEl.pause();
		videoMinimizado.cerrar();
	}

	function expandir(e) {
		e?.stopPropagation();
		// NOTA: esto asume que agregás un método `expandir()` en videoMinimizado.js
		// que navegue a la página del video y limpie el estado minimizado.
		// Si el store no lo tiene todavía, avisame y te lo armo.
		if (typeof videoMinimizado.expandir === 'function') {
			videoMinimizado.expandir();
		} else {
			console.warn('videoMinimizado.expandir() no está implementado en el store');
		}
	}

	// --- Arrastre de la ventana flotante ---
	function iniciarArrastre(e) {
		// No iniciar arrastre si se clickeó un control interactivo
		if (e.target.closest('button') || e.target.closest('.barra-progreso')) return;

		isDragging = true;
		const rect = contenedor.getBoundingClientRect();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;

		if (!hasMoved) {
			pos = { x: rect.left, y: rect.top };
		}

		offset = {
			x: clientX - rect.left,
			y: clientY - rect.top
		};

		if (e.touches) {
			document.addEventListener('touchmove', moverArrastre, { passive: false });
			document.addEventListener('touchend', finalizarArrastre);
		} else {
			document.addEventListener('mousemove', moverArrastre);
			document.addEventListener('mouseup', finalizarArrastre);
		}
	}

	function moverArrastre(e) {
		if (!isDragging) return;
		e.preventDefault();

		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		const clientY = e.touches ? e.touches[0].clientY : e.clientY;

		const nuevaX = clientX - offset.x;
		const nuevaY = clientY - offset.y;

		const maxX = window.innerWidth - contenedor.offsetWidth;
		const maxY = window.innerHeight - contenedor.offsetHeight;

		pos = {
			x: Math.max(0, Math.min(nuevaX, maxX)),
			y: Math.max(0, Math.min(nuevaY, maxY))
		};
		hasMoved = true;
	}

	function finalizarArrastre() {
		isDragging = false;
		document.removeEventListener('mousemove', moverArrastre);
		document.removeEventListener('mouseup', finalizarArrastre);
		document.removeEventListener('touchmove', moverArrastre);
		document.removeEventListener('touchend', finalizarArrastre);
	}

	function estiloPos() {
		if (!hasMoved || pos.x === null) {
			return 'right: 1.25rem; bottom: 1.25rem;';
		}
		return `left: ${pos.x}px; top: ${pos.y}px;`;
	}

	// --- Controles de reproducción ---
	function togglePlay(e) {
		e?.stopPropagation();
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play();
		} else {
			videoEl.pause();
		}
	}

	function saltar(segundos, e) {
		e?.stopPropagation();
		if (!videoEl) return;
		const max = duracion || videoEl.duration || 0;
		videoEl.currentTime = Math.max(0, Math.min(videoEl.currentTime + segundos, max));
	}

	function toggleMute(e) {
		e?.stopPropagation();
		if (!videoEl) return;
		videoEl.muted = !videoEl.muted;
		silenciado = videoEl.muted;
	}

	function onPlay() {
		reproduciendo = true;
		handleTimeUpdate(tiempoActual, true);
	}
	function onPause() {
		reproduciendo = false;
		handleTimeUpdate(tiempoActual, false);
	}
	function onTimeUpdate() {
		if (!videoEl || arrastrandoProgreso) return;
		tiempoActual = videoEl.currentTime;
		handleTimeUpdate(tiempoActual, reproduciendo);
	}
	function onLoadedMetadata() {
		cargando = false;
		duracion = videoEl.duration || 0;
		if (state.currentTime) {
			videoEl.currentTime = state.currentTime;
		}
	}
	function onWaiting() {
		cargando = true;
	}
	function onPlaying() {
		cargando = false;
	}
	function onEnded() {
		reproduciendo = false;
	}

	function formatTiempo(segundos) {
		if (!segundos || isNaN(segundos)) return '0:00';
		const m = Math.floor(segundos / 60);
		const s = Math.floor(segundos % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	// --- Barra de progreso (seek estilo YouTube) ---
	function calcularTiempoDesdeX(clientX) {
		if (!barraEl) return 0;
		const rect = barraEl.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		return ratio * (duracion || 0);
	}

	function iniciarSeek(e) {
		e.stopPropagation();
		arrastrandoProgreso = true;
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		tiempoActual = calcularTiempoDesdeX(clientX);

		if (e.touches) {
			document.addEventListener('touchmove', moverSeek, { passive: false });
			document.addEventListener('touchend', finalizarSeek);
		} else {
			document.addEventListener('mousemove', moverSeek);
			document.addEventListener('mouseup', finalizarSeek);
		}
	}

	function moverSeek(e) {
		if (!arrastrandoProgreso) return;
		e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		tiempoActual = calcularTiempoDesdeX(clientX);
	}

	function finalizarSeek() {
		if (!arrastrandoProgreso) return;
		arrastrandoProgreso = false;
		if (videoEl) videoEl.currentTime = tiempoActual;
		document.removeEventListener('mousemove', moverSeek);
		document.removeEventListener('mouseup', finalizarSeek);
		document.removeEventListener('touchmove', moverSeek);
		document.removeEventListener('touchend', finalizarSeek);
	}
</script>

{#if state.activo}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={contenedor}
		// onmousedown={iniciarArrastre}
		// ontouchstart={iniciarArrastre}
		class="fixed z-[9999] bottom-5 max-w-xl right-2 select-none w-[80%] bg-zinc-950 text-white rounded-3xl"
		// class:cursor-grabbing={isDragging}
		// class:cursor-grab={!isDragging}
		// style="{estiloPos()} touch-action: none; max-width: 540px;"
	>
		<div
			class="relative rounded-3xl overflow-hidden transition-all duration-300"
			style="
				box-shadow: 0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
				transform: {isDragging ? 'scale(1.02)' : 'scale(1)'};
				transition: transform 0.15s ease, box-shadow 0.3s ease;
			"
		>
			<!-- Área de video + controles -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="relative w-full bg-black group"
				style="aspect-ratio: 16/9;"
				onmouseenter={() => (mostrarControles = true)}
				onmouseleave={() => (mostrarControles = false)}
			>
				<!-- Thumbnail / poster de fondo -->
				{#if state.poster}
					<img
						src={state.poster}
						alt={state.titulo}
						class="absolute inset-0 w-full h-full object-cover"
						style="opacity: {streamListo && !cargando ? 0 : 1}; transition: opacity 0.4s ease;"
					/>
				{/if}

				<!-- Video real -->
				{#if streamListo}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video
						bind:this={videoEl}
						src={state.url}
						poster={state.poster}
						autoplay
						playsinline
						class="absolute inset-0 w-full h-full object-contain bg-black"
						onclick={togglePlay}
						onplay={onPlay}
						onpause={onPause}
						ontimeupdate={onTimeUpdate}
						onloadedmetadata={onLoadedMetadata}
						onwaiting={onWaiting}
						onplaying={onPlaying}
						onended={onEnded}
					></video>
				{/if}

				<!-- Spinner de carga -->
				{#if !streamListo || cargando}
					<div
						class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm gap-3 pointer-events-none"
					>
						<div
							class="w-10 h-10 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin"
						></div>
					</div>
				{/if}

				<!-- Overlay de controles (aparece con hover, estilo PiP/YouTube) -->
				<div
					class="absolute inset-0 flex flex-col justify-between transition-opacity duration-200 pointer-events-none"
					style="opacity: {mostrarControles || isDragging
						? 1
						: 0}; background: linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.65) 100%);"
				>
					<!-- Barra superior: expandir / cerrar -->
					<div class="flex items-center justify-between px-2 pt-2 pointer-events-auto">
						<button
							onclick={expandir}
							class="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
							title="Expandir"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="13"
								height="13"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.4"
							>
								<path
									d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3"
								/>
							</svg>
						</button>

						<button
							onclick={cerrar}
							class="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/80 transition-colors group/close"
							title="Cerrar"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.8"
							>
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</button>
					</div>

					<!-- Controles centrales: retroceder / play-pausa / avanzar -->
					<div class="flex items-center justify-center gap-5 pointer-events-auto">
						<button
							onclick={(e) => saltar(-10, e)}
							class="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white transition-colors"
							title="Retroceder 10s"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
								/>
							</svg>
						</button>

						<button
							onclick={togglePlay}
							class="w-11 h-11 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 transition-colors"
							title={reproduciendo ? 'Pausar' : 'Reproducir'}
						>
							{#if reproduciendo}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="white"
								>
									<rect x="6" y="4" width="4" height="16" rx="1" />
									<rect x="14" y="4" width="4" height="16" rx="1" />
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="white"
								>
									<path d="M8 5v14l11-7z" />
								</svg>
							{/if}
						</button>

						<button
							onclick={(e) => saltar(10, e)}
							class="w-8 h-8 flex items-center justify-center text-white/90 hover:text-white transition-colors"
							title="Avanzar 10s"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path
									d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"
								/>
							</svg>
						</button>
					</div>

					<!-- Barra inferior: tiempo, mute y progreso -->
					<div class="px-3 pb-2 pointer-events-auto">
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-[10px] text-white/80 font-medium tabular-nums">
								{formatTiempo(tiempoActual)} / {formatTiempo(duracion)}
							</span>
							<button
								onclick={toggleMute}
								class="w-6 h-6 flex items-center justify-center text-white/90 hover:text-white transition-colors"
								title={silenciado ? 'Activar sonido' : 'Silenciar'}
							>
								{#if silenciado}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M16.5 12A4.5 4.5 0 0 0 14 8v1.79l2.48 2.48c.01-.09.02-.18.02-.27zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="15"
										height="15"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
										/>
									</svg>
								{/if}
							</button>
						</div>

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							bind:this={barraEl}
							onmousedown={iniciarSeek}
							ontouchstart={iniciarSeek}
							class="barra-progreso relative w-full h-3 flex items-center cursor-pointer group/bar"
						>
							<div
								class="relative w-full h-[3px] rounded-full bg-white/25 group-hover/bar:h-[5px] transition-all"
							>
								<div
									class="absolute left-0 top-0 h-full rounded-full bg-red-500"
									style="width: {progreso}%;"
								></div>
								<div
									class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
									style="left: calc({progreso}% - 6px);"
								></div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Footer con título -->
			<div class="p-5">
				<p class="text-xs font-medium text-zinc-200 leading-tight truncate">
					{state.titulo || 'Reproduciendo...'}
				</p>
			</div>
		</div>
	</div>
{/if}
