<script>
	import { onMount, tick } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import VideoGrid from '$lib/components/VideoGrid.svelte';
	import { buscarVideos, obtenerStreamVideo } from '$lib/utils/api.js';
	import { obtenerParametros } from '$lib/utils/url.js';
	import { videoMinimizado } from '$lib/stores/videoMinimizado.js';
	import { goto } from '$app/navigation';

	let busqueda = $state('');
	let busquedaActual = $state('');
	let resultados = $state([]);
	let shortsCarrusel = $state([]);
	let canalDestacado = $state(null);
	let hasMas = $state(false);
	let buscando = $state(false);
	let esPrimeraCarga = $state(true);
	let cargandoVideo = $state(false);

	async function buscar(esContinuation = false) {
		if (buscando) return;
		buscando = true;

		try {
			const queryABuscar = busquedaActual || 'Tendencias música videos';
			const data = await buscarVideos(queryABuscar, esContinuation);

			if (esContinuation) {
				const idsExistentes = new Set(resultados.map(v => v.id));
				const nuevos = data.videos.filter(v => !idsExistentes.has(v.id));
				// Filtrar los canales de las continuaciones si ya tenemos uno destacado
				const filtradosNuevos = nuevos.filter(v => v.type !== 'Channel');
				resultados = [...resultados, ...filtradosNuevos];
			} else {
				// Buscar canal destacado
				const primerCanal = data.videos.find(v => v.type === 'Channel');
				if (primerCanal) {
					canalDestacado = primerCanal;
					resultados = data.videos.filter(v => v.id !== primerCanal.id);
				} else {
					canalDestacado = null;
					resultados = data.videos;
				}

				// Cargar shorts para el carrusel
				fetch('/YTpro', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ query: queryABuscar, isShorts: true })
				})
				.then(r => r.json())
				.then(d => {
					shortsCarrusel = d.videos?.slice(0, 8) || [];
				})
				.catch(err => console.error("Error al cargar shorts:", err));
			}
			hasMas = data.hasMas;
		} catch (error) {
			console.error('Error al buscar:', error);
		} finally {
			buscando = false;
			esPrimeraCarga = false;
		}
	}

	async function manejarBusqueda() {
		if (!busqueda.trim()) return;

		busquedaActual = busqueda;
		goto(`/?q=${busqueda}`, { replaceState: false, noScroll: true });

		resultados = [];
		shortsCarrusel = [];
		canalDestacado = null;
		hasMas = false;
		await buscar(false);
		await tick();
		if (contenedorScroll) contenedorScroll.scrollTo(0, 0);
	}

	async function seleccionarVideo(item) {
		if (cargandoVideo) return;
		cargandoVideo = true;

		try {
			const poster = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/maxresdefault.jpg`;
			const titulo = item.title || 'Video';

			// Mostrar reproductor de inmediato con poster mientras carga
			videoMinimizado.minimizar(item.id, null, poster, titulo, 0, false);

			// Obtener stream en paralelo
			const data = await obtenerStreamVideo(item.id, 'video');

			// Actualizar el store con la URL real
			videoMinimizado.minimizar(item.id, data.stream, poster, titulo, 0, true);
		} catch (error) {
			console.error('Error al cargar video:', error);
			videoMinimizado.cerrar();
		} finally {
			cargandoVideo = false;
		}
	}

	let centinela = $state(null);
	let contenedorScroll = $state(null);

	async function cargarMas() {
		if (buscando || !hasMas) return;
		await buscar(true);
	}

	onMount(async () => {
		const params = obtenerParametros();

		if (params.busqueda) {
			busqueda = params.busqueda;
			busquedaActual = params.busqueda;
		} else {
			busquedaActual = 'Tendencias música videos';
		}

		await buscar(false);
		await tick();

		// IntersectionObserver con root = el div que scrollea
		// Así funciona aunque window no haga scroll
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) cargarMas();
			},
			{
				root: contenedorScroll,  // el div scrolleable, no el viewport
				rootMargin: '300px',
				threshold: 0
			}
		);

		if (centinela) observer.observe(centinela);

		return () => observer.disconnect();
	});
</script>
<main class="bg-black h-dvh w-dvw grid xl:grid-cols-[auto_1fr] max-md:flex flex-col-reverse ">

<nav class="min-w-27 py-4 pt-10 px-5 pl-10 text-white max-md:p-0 overflow-hidden">

<div class="flex items-center gap-2 ">
	<button class="">
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-menu-3">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M10 6h10" />
	<path d="M4 12h16" />
	<path d="M7 12h13" />
	<path d="M4 18h10" />
</svg>
</button>
<h2 class="font-sup text-3xl text-center p-2 max-xl:hidden">YTpro</h2>

</div>
	<div class=" h-full max-md:h-20 rounded-2xl gap-2 flex xl:flex-col max-md:justify-between  max-md:p-6 max-sm:pb-20">
	
	<button onclick={() => goto('/')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-home">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M5 12l-2 0l9 -9l9 9l-2 0" />
	<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
	<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
</svg>
<p class="xl:w-10 text-nowrap max-sm:hidden  max-sm:p-2">Inicio</p>
	</button>
	
		<button onclick={() => goto('/shorts')} class="hover:bg-zinc-950/30 group p-5 rounded-full flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
	<path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.71 2.28 3.3l1.2.5L6 14.94c-1.84.96-2.56 3.22-1.6 5.06.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.71-2.23-3.25z"/>
</svg>
<p class="xl:w-10 text-nowrap max-sm:hidden  max-sm:p-2">Shorts</p>
	</button>

		<button class="hover:bg-zinc-950/30 group p-5  max-sm:w-fit xl:w-40 rounded-full flex items-center gap-2">
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-history">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M12 8l0 4l2 2" />
	<path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
</svg>
<p class="xl:w-10 text-nowrap max-sm:hidden  max-sm:p-2">Historial</p>
	</button>


			<button class="hover:bg-zinc-950/30 group p-5 max-sm:w-fit xl:w-40 rounded-full flex items-center gap-2">
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-playlist">
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M11 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
	<path d="M17 17v-13h4" />
	<path d="M13 5h-10" />
	<path d="M3 9l10 0" />
	<path d="M9 13h-6" />
</svg>
<p class="xl:w-10 text-nowrap max-sm:hidden  max-sm:p-2">Play lists</p>
	</button>


	</div>
</nav>
	<div bind:this={contenedorScroll} class="text-white flex flex-col overflow-x-hidden overflow-y-auto h-full w-full">
	<Header bind:busqueda {buscando} onBuscar={manejarBusqueda} />

	{#if !esPrimeraCarga && busquedaActual && busquedaActual !== 'Tendencias música videos'}
		<div class="px-6 pt-6 pb-2">
			<h2 class="text-xl font-bold text-white">
				Resultados para: <span class="text-blue-500">"{busquedaActual}"</span>
			</h2>
		</div>
	{/if}

	<VideoGrid {resultados} {buscando} {shortsCarrusel} {canalDestacado} onSeleccionarVideo={seleccionarVideo} />

	<!-- Centinela para IntersectionObserver -->
	<div bind:this={centinela} class="h-4 w-full"></div>

</div>

</main>