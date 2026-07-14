<script>
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { buscarVideos, obtenerStreamVideo } from '$lib/utils/api.js';

	// Elementos del DOM
	let contenedorScroll = $state(null);
	let centinela = $state(null);

	// Estados reactivos
	let shorts = $state([]);
	let buscando = $state(false);
	let hasMas = $state(true);
	let activeId = $state($page.params.id);
	let streamUrls = $state({}); // key: id, value: streamUrl
	let loadingStreams = $state({}); // key: id, value: boolean
	let videosPaused = $state({}); // key: id, value: boolean
	let videoElements = {}; // key: id, value: HTMLVideoElement
	let mutedGlobal = $state(false);

	// Gestos
	let doubleClickedId = $state(null);
	let doubleClickedSide = $state(''); // 'left' | 'right'
	let longPressedId = $state(null);
	let originalSpeed = 1.0;
	let longPressTimeout;

	// Cargar shorts iniciales y el actual
	async function cargarShorts(esContinuation = false) {
		if (buscando || !hasMas) return;
		buscando = true;

		try {
			const res = await fetch('/YTpro', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					query: 'shorts music trends',
					isShorts: true,
					continuarBusqueda: esContinuation
				})
			});
			const data = await res.json();
			const nuevosShorts = data.videos || [];
			
			if (esContinuation) {
				// Deduplicar
				const idsExistentes = new Set(shorts.map(s => s.id));
				const filtrados = nuevosShorts.filter(s => !idsExistentes.has(s.id));
				shorts = [...shorts, ...filtrados];
			} else {
				// Asegurar que el short del ID actual esté primero si no está en la lista
				const activeShortExists = nuevosShorts.some(s => s.id === activeId);
				if (!activeShortExists && activeId) {
					// Conseguir metadata del activeId o simularlo temporalmente
					const activeObj = {
						id: activeId,
						type: 'Short',
						title: 'Short en reproducción',
						channel: 'Canal',
						thumbnail: `https://i.ytimg.com/vi/${activeId}/maxresdefault.jpg`,
						views: ''
					};
					shorts = [activeObj, ...nuevosShorts];
				} else {
					shorts = nuevosShorts;
				}
			}
			hasMas = data.hasMas;
		} catch (error) {
			console.error('Error al buscar shorts:', error);
		} finally {
			buscando = false;
		}
	}

	// Cargar stream individual para un short
	async function asegurarStream(id) {
		if (streamUrls[id] || loadingStreams[id]) return;
		loadingStreams[id] = true;
		try {
			const data = await obtenerStreamVideo(id, 'video');
			streamUrls[id] = data.stream;
		} catch (error) {
			console.error(`Error al cargar stream para short ${id}:`, error);
		} finally {
			loadingStreams[id] = false;
		}
	}

	// Observar qué short está en pantalla
	function configurarObserver() {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach(async (entry) => {
					const id = entry.target.dataset.id;
					if (entry.isIntersecting) {
						activeId = id;
						// Reemplazar la URL en el navegador de manera silenciosa
						goto(`/shorts/${id}`, { replaceState: true, noScroll: true });
						
						// Cargar stream y reproducir
						await asegurarStream(id);
						
						// Reproducir este video y pausar los otros
						Object.keys(videoElements).forEach(vidId => {
							const el = videoElements[vidId];
							if (el) {
								if (vidId === id) {
									el.play().catch(() => {});
									videosPaused[id] = false;
								} else {
									el.pause();
									videosPaused[vidId] = true;
								}
							}
						});
					} else {
						const el = videoElements[id];
						if (el) {
							el.pause();
							videosPaused[id] = true;
						}
					}
				});
			},
			{ threshold: 0.6 } // El video debe estar al menos al 60% visible
		);

		// Observar cada item de short
		$effect(() => {
			if (shorts.length > 0) {
				const items = document.querySelectorAll('.short-item');
				items.forEach(item => observer.observe(item));
				return () => {
					items.forEach(item => observer.unobserve(item));
				};
			}
		});
	}

	// Observer para el centinela del scroll infinito
	function configurarCentinela() {
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					cargarShorts(true);
				}
			},
			{ threshold: 0.1, rootMargin: '300px' }
		);

		$effect(() => {
			if (centinela) {
				obs.observe(centinela);
				return () => obs.unobserve(centinela);
			}
		});
	}

	// Gestos interactivos
	function handleDblClick(e, id) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const el = videoElements[id];
		if (!el) return;

		doubleClickedId = id;
		if (x < rect.width / 2) {
			doubleClickedSide = 'left';
			el.currentTime = Math.max(0, el.currentTime - 10);
		} else {
			doubleClickedSide = 'right';
			el.currentTime = Math.min(el.duration || 9999, el.currentTime + 10);
		}
		setTimeout(() => { doubleClickedId = null; }, 500);
	}

	function handleMouseDown(e, id) {
		const el = videoElements[id];
		if (!el) return;
		
		longPressTimeout = setTimeout(() => {
			longPressedId = id;
			originalSpeed = el.playbackRate;
			el.playbackRate = 2.0;
		}, 400);
	}

	function handleMouseUp(id) {
		clearTimeout(longPressTimeout);
		if (longPressedId === id) {
			longPressedId = null;
			const el = videoElements[id];
			if (el) el.playbackRate = originalSpeed;
		}
	}

	function togglePlay(id) {
		const el = videoElements[id];
		if (!el) return;
		if (el.paused) {
			el.play();
			videosPaused[id] = false;
		} else {
			el.pause();
			videosPaused[id] = true;
		}
	}

	function toggleMute() {
		mutedGlobal = !mutedGlobal;
		Object.values(videoElements).forEach(el => {
			if (el) el.muted = mutedGlobal;
		});
	}

	onMount(async () => {
		await cargarShorts(false);
		await tick();
		configurarObserver();
		configurarCentinela();
	});
</script>

<svelte:head>
	<title>YTpro - Shorts</title>
</svelte:head>

<main class="bg-black h-dvh w-dvw grid xl:grid-cols-[auto_1fr] max-md:flex flex-col-reverse overflow-hidden">
	
	<!-- Sidebar Navegación Lateral -->
	<nav class="min-w-27 py-4 pt-10 px-5 pl-10 text-white max-md:p-0 overflow-hidden flex-shrink-0 z-20">
		<h2 class="font-sup text-3xl text-center p-2 max-xl:hidden">YTpro</h2>
		<div class="h-full max-md:h-20 rounded-2xl gap-2 flex xl:flex-col max-md:justify-between max-md:p-6 max-sm:pb-20">
			
			<!-- Botón Inicio -->
			<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M5 12l-2 0l9 -9l9 9l-2 0" />
					<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
					<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Inicio</p>
			</button>
			
			<!-- Botón Shorts (Activo) -->
			<button onclick={() => goto('/shorts')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-white bg-zinc-900/40">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
					<path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.71 2.28 3.3l1.2.5L6 14.94c-1.84.96-2.56 3.22-1.6 5.06.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.71-2.23-3.25z"/>
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Shorts</p>
			</button>
			
			<!-- Botón Historial -->
			<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M12 8l0 4l2 2" />
					<path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Historial</p>
			</button>

			<!-- Botón Playlists -->
			<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M11 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
					<path d="M17 17v-13h4" />
					<path d="M13 5h-10" />
					<path d="M3 9l10 0" />
					<path d="M9 13h-6" />
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Playlists</p>
			</button>
		</div>
	</nav>

	<!-- Contenedor Principal de Shorts -->
	<div 
		bind:this={contenedorScroll} 
		class="flex-1 h-full overflow-y-scroll snap-y snap-mandatory bg-black flex flex-col items-center select-none"
		style="scroll-behavior: smooth;"
	>
		{#each shorts as item (item.id)}
			<section 
				data-id={item.id}
				class="short-item w-full h-full min-h-screen snap-start flex items-center justify-center p-4 max-md:p-0 relative"
			>
				<!-- Tarjeta de Short (Aspect 9:16) -->
				<div 
					class="relative h-[90dvh] max-md:h-full aspect-[9/16] max-md:w-full bg-zinc-950 rounded-3xl max-md:rounded-none overflow-hidden shadow-2xl flex items-center justify-center"
					onmousedown={(e) => handleMouseDown(e, item.id)}
					onmouseup={() => handleMouseUp(item.id)}
					onmouseleave={() => handleMouseUp(item.id)}
					ondblclick={(e) => handleDblClick(e, item.id)}
				>
					<!-- Thumbnail de fondo (mientras carga el stream) -->
					{#if !streamUrls[item.id]}
						<img 
							src={item.thumbnail || `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`} 
							alt="" 
							class="absolute inset-0 w-full h-full object-cover blur-sm opacity-50"
						/>
						<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-3">
							<div class="w-10 h-10 rounded-full border-2 border-white/10 border-t-red-600 animate-spin"></div>
							<span class="text-xs font-semibold text-zinc-400">Preparando Short...</span>
						</div>
					{/if}

					<!-- Video Principal -->
					{#if streamUrls[item.id]}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							bind:this={videoElements[item.id]}
							src={streamUrls[item.id]}
							loop
							playsinline
							muted={mutedGlobal}
							class="w-full h-full object-cover"
							onclick={() => togglePlay(item.id)}
						></video>
					{/if}

					<!-- Gesto Doble Click (Efectos visuales) -->
					{#if doubleClickedId === item.id}
						<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
							<div class="bg-black/60 backdrop-blur-md px-4 py-3 rounded-full text-center scale-up">
								<span class="block text-white font-bold text-sm">
									{doubleClickedSide === 'left' ? '-10s ⏪' : '⏩ +10s'}
								</span>
							</div>
						</div>
					{/if}

					<!-- Gesto Long Press 2.0x -->
					{#if longPressedId === item.id}
						<div class="absolute top-6 left-1/2 -translate-x-1/2 bg-black/85 px-4 py-1.5 rounded-full border border-red-500/30 text-xs font-bold text-white tracking-widest flex items-center gap-2 pointer-events-none z-30">
							<span class="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
							<span>2.0X VELOCIDAD</span>
						</div>
					{/if}

					<!-- Overlay de pausa central -->
					{#if videosPaused[item.id] && streamUrls[item.id]}
						<button 
							onclick={() => togglePlay(item.id)}
							class="absolute inset-0 flex items-center justify-center bg-black/20 z-10 w-full"
						>
							<div class="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-2xl">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-white translate-x-0.5">
									<path d="M5 3l14 9-14 9V3z"/>
								</svg>
							</div>
						</button>
					{/if}

					<!-- Controles de Mute e Info Superior -->
					<div class="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
						<div class="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/90 font-bold border border-white/5 uppercase tracking-wide">
							YTpro Shorts
						</div>
						<button 
							onclick={toggleMute}
							class="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all pointer-events-auto border border-white/5 text-white"
						>
							{#if mutedGlobal}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
									<path d="M15 8a5 5 0 0 1-2.5 4.3M21 8a10 10 0 0 1-5 8.6M3 3l18 18M9 9l-4 4H3v-6h4l4-4v6.7" />
								</svg>
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
									<path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
								</svg>
							{/if}
						</button>
					</div>

					<!-- Overlay de Metadata del Short (Esquina inferior izquierda) -->
					<div class="absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-3 z-10 text-white">
						<!-- Autor/Canal -->
						<div class="flex items-center gap-2">
							<div class="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-sm text-red-500 uppercase">
								{item.channel?.charAt(0) || 'Y'}
							</div>
							<div class="flex flex-col">
								<span class="text-sm font-semibold truncate max-w-[180px]">{item.channel}</span>
								<span class="text-[10px] text-zinc-400">YouTube Creator</span>
							</div>
							<button class="ml-2 bg-white text-black text-[11px] font-bold px-3 py-1 rounded-full hover:bg-zinc-200 transition-colors">
								Suscribir
							</button>
						</div>

						<!-- Título del Short -->
						<p class="text-xs font-medium text-zinc-100 line-clamp-2 leading-relaxed">
							{item.title}
						</p>

						<!-- Barra de progreso sutil -->
						<div class="w-full h-[2px] bg-white/20 rounded-full overflow-hidden">
							<div 
								class="h-full bg-red-600 rounded-full transition-all duration-100" 
								style="width: {videoElements[item.id] ? (videoElements[item.id].currentTime / (videoElements[item.id].duration || 1)) * 100 : 0}%"
							></div>
						</div>
					</div>
				</div>

				<!-- Columna de Botones de Interacción (A la derecha del frame en Desktop, superpuesto en Móvil) -->
				<div class="absolute xl:relative xl:ml-4 bottom-20 right-4 xl:bottom-0 flex flex-col gap-4 items-center z-20 text-white pointer-events-auto">
					
					<!-- Botón Like -->
					<div class="flex flex-col items-center gap-1.5">
						<button class="w-11 h-11 rounded-full bg-zinc-900/80 border border-white/5 hover:bg-zinc-800 flex items-center justify-center text-zinc-200 hover:text-red-500 active:scale-95 transition-all shadow-lg">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
								<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
							</svg>
						</button>
						<span class="text-[10px] text-zinc-400 font-bold">Me gusta</span>
					</div>

					<!-- Botón Dislike -->
					<div class="flex flex-col items-center gap-1.5">
						<button class="w-11 h-11 rounded-full bg-zinc-900/80 border border-white/5 hover:bg-zinc-800 flex items-center justify-center text-zinc-200 hover:text-red-500 active:scale-95 transition-all shadow-lg">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
								<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
							</svg>
						</button>
						<span class="text-[10px] text-zinc-400 font-bold">Dislike</span>
					</div>

					<!-- Botón Compartir -->
					<div class="flex flex-col items-center gap-1.5">
						<button class="w-11 h-11 rounded-full bg-zinc-900/80 border border-white/5 hover:bg-zinc-800 flex items-center justify-center text-zinc-200 hover:text-red-500 active:scale-95 transition-all shadow-lg">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
								<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
							</svg>
						</button>
						<span class="text-[10px] text-zinc-400 font-bold">Compartir</span>
					</div>

					<!-- Botón Regresar -->
					<div class="flex flex-col items-center gap-1.5">
						<button onclick={() => goto('/')} class="w-11 h-11 rounded-full bg-red-600/90 border border-white/5 hover:bg-red-600 flex items-center justify-center text-white active:scale-95 transition-all shadow-lg">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<path d="M19 12H5M12 19l-7-7 7-7"/>
							</svg>
						</button>
						<span class="text-[10px] text-red-500 font-bold">Salir</span>
					</div>
				</div>
			</section>
		{/each}

		<!-- Centinela para scroll infinito -->
		<div bind:this={centinela} class="h-20 w-full flex items-center justify-center p-4 bg-black">
			{#if buscando}
				<div class="w-6 h-6 rounded-full border-2 border-white/10 border-t-red-600 animate-spin"></div>
			{/if}
		</div>
	</div>
</main>

<style>
	/* Desactivar scrollbars */
	.snap-y::-webkit-scrollbar {
		display: none;
	}
	.snap-y {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	@keyframes scaleUp {
		0% { transform: scale(0.8); opacity: 0; }
		50% { transform: scale(1.1); opacity: 1; }
		100% { transform: scale(1); opacity: 0; }
	}

	.scale-up {
		animation: scaleUp 0.5s ease-out forwards;
	}
</style>
