<script>
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import VideoGrid from '$lib/components/VideoGrid.svelte';
	import { obtenerStreamVideo } from '$lib/utils/api.js';
	import { videoMinimizado } from '$lib/stores/videoMinimizado.js';

	let channelId = $state($page.params.id);
	let infoCanal = $state(null);
	let videos = $state([]);
	let cargando = $state(true);
	let cargandoVideo = $state(false);
	let suscrito = $state(false);
	let busqueda = $state('');

	async function cargarInformacionCanal() {
		cargando = true;
		try {
			const res = await fetch('/YTpro', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ channelId })
			});
			const data = await res.json();
			if (data.error) throw new Error(data.error);

			infoCanal = {
				title: data.title,
				avatar: data.avatar,
				banner: data.banner,
				subscribers: data.subscribers
			};
			videos = data.videos || [];
		} catch (error) {
			console.error('Error al cargar canal:', error);
		} finally {
			cargando = false;
		}
	}

	async function seleccionarVideo(item) {
		if (cargandoVideo) return;
		cargandoVideo = true;

		try {
			const poster = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`;
			const titulo = item.title || 'Video';

			videoMinimizado.minimizar(item.id, null, poster, titulo, 0, false);
			const data = await obtenerStreamVideo(item.id, 'video');
			videoMinimizado.minimizar(item.id, data.stream, poster, titulo, 0, true);
		} catch (error) {
			console.error('Error al cargar video:', error);
			videoMinimizado.cerrar();
		} finally {
			cargandoVideo = false;
		}
	}

	function manejarBusqueda() {
		if (!busqueda.trim()) return;
		goto(`/?q=${busqueda}`);
	}

	onMount(() => {
		cargarInformacionCanal();
	});
</script>

<svelte:head>
	<title>{infoCanal ? infoCanal.title : 'Cargando Canal...'} - YTpro</title>
</svelte:head>

<main class="bg-black h-dvh w-dvw grid xl:grid-cols-[auto_1fr] max-md:flex flex-col-reverse overflow-hidden">
	
	<!-- Sidebar Navegación Lateral -->
	<nav class="min-w-27 py-4 pt-10 px-5 pl-10 text-white max-md:p-0 overflow-hidden flex-shrink-0">
		<h2 class="font-sup text-3xl text-center p-2 max-xl:hidden">YTpro</h2>
		<div class="h-full max-md:h-20 rounded-2xl gap-2 flex xl:flex-col max-md:justify-between max-md:p-6 max-sm:pb-20">
			
			<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M5 12l-2 0l9 -9l9 9l-2 0" />
					<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
					<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Inicio</p>
			</button>
			
			<button onclick={() => goto('/shorts')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
					<path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.71 2.28 3.3l1.2.5L6 14.94c-1.84.96-2.56 3.22-1.6 5.06.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.71-2.23-3.25z"/>
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Shorts</p>
			</button>
			
			<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M12 8l0 4l2 2" />
					<path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
				</svg>
				<p class="xl:w-10 text-nowrap max-sm:hidden">Historial</p>
			</button>

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

	<!-- Contenido del Canal -->
	<div class="flex-1 h-full overflow-y-auto text-white flex flex-col">
		<Header bind:busqueda buscando={false} onBuscar={manejarBusqueda} />

		{#if cargando}
			<div class="flex-1 flex flex-col items-center justify-center gap-3">
				<div class="w-10 h-10 rounded-full border-2 border-white/10 border-t-red-600 animate-spin"></div>
				<span class="text-sm font-semibold text-zinc-400">Cargando canal...</span>
			</div>
		{:else if infoCanal}
			<!-- Banner Superior -->
			<div class="w-full relative bg-zinc-950 aspect-[6/1] max-md:aspect-[3/1] overflow-hidden flex-shrink-0">
				{#if infoCanal.banner}
					<img src={infoCanal.banner} alt="Banner" class="w-full h-full object-cover" />
				{:else}
					<div class="w-full h-full bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900"></div>
				{/if}
			</div>

			<!-- Cabecera del Canal -->
			<div class="max-w-[1600px] w-full mx-auto px-6 py-8 border-b border-zinc-900 flex flex-col md:flex-row items-center md:items-start gap-6">
				<!-- Avatar circular -->
				<div class="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-zinc-800 border-4 border-black -mt-16 md:-mt-20 z-10 flex-shrink-0 shadow-2xl">
					{#if infoCanal.avatar}
						<img src={infoCanal.avatar} alt={infoCanal.title} class="w-full h-full object-cover" />
					{:else}
						<div class="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-500">
							{infoCanal.title?.charAt(0)}
						</div>
					{/if}
				</div>

				<!-- Metadatos -->
				<div class="flex-1 flex flex-col gap-2 text-center md:text-left">
					<h1 class="text-2xl md:text-3xl font-black text-white">{infoCanal.title}</h1>
					<p class="text-sm text-zinc-400">{infoCanal.subscribers || 'Sin suscriptores'}</p>
					
					<button 
						onclick={() => suscrito = !suscrito}
						class="mt-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 w-40 self-center md:self-start {suscrito ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white text-black hover:bg-zinc-200'}"
					>
						{suscrito ? 'Suscrito ✓' : 'Suscribirse'}
					</button>
				</div>
			</div>

			<!-- Grilla de Videos del Canal -->
			<div class="flex-1">
				<div class="px-6 pt-6">
					<h2 class="text-lg font-bold text-white">Videos de {infoCanal.title}</h2>
				</div>
				<VideoGrid resultados={videos} buscando={false} onSeleccionarVideo={seleccionarVideo} />
			</div>
		{/if}
	</div>
</main>
