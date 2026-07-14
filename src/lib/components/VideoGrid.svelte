<script>
	import VideoCard    from './VideoCard.svelte';
	import ShortCard    from './ShortCard.svelte';
	import PlaylistCard from './PlaylistCard.svelte';
	import ChannelCard  from './ChannelCard.svelte';
	import ShortsCarousel from './ShortsCarousel.svelte';
	import SkeletonLoader from './SkeletonLoader.svelte';
	import { goto } from '$app/navigation';

	let { 
		resultados = [], 
		buscando = false, 
		shortsCarrusel = [], 
		canalDestacado = null, 
		onSeleccionarVideo 
	} = $props();

	// Estado local de suscripción
	let suscrito = $state(false);

	function toggleSuscribir() {
		suscrito = !suscrito;
	}

	function irAlCanal() {
		if (canalDestacado?.id) {
			goto(`/canal/${canalDestacado.id}`);
		}
	}
</script>

<div class="flex-1 flex flex-col w-full">
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-x-2.5 gap-y-3 p-6 max-w-[1600px] mx-auto w-full">

		<!-- ── BANNER DE CANAL DESTACADO ── -->
		{#if canalDestacado}
			<div class="col-span-full mb-6 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 sm:p-8 rounded-3xl border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
				<div class="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
				
				<div class="flex flex-col sm:flex-row items-center gap-6 z-10 text-center sm:text-left">
					<div class="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 ring-4 ring-zinc-800/50 group-hover:ring-red-600/40 transition-all duration-300">
						{#if canalDestacado.thumbnail}
							<img src={canalDestacado.thumbnail} alt={canalDestacado.title} class="w-full h-full object-cover" />
						{:else}
							<div class="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-500">
								{canalDestacado.title?.charAt(0)}
							</div>
						{/if}
					</div>
					
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center sm:justify-start gap-2">
							<span class="bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Canal Destacado</span>
							{#if canalDestacado.verified}
								<svg class="w-4 h-4 text-blue-400 fill-blue-400" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
								</svg>
							{/if}
						</div>
						<h2 class="text-xl sm:text-2xl font-black text-white">{canalDestacado.title}</h2>
						<div class="flex items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400">
							{#if canalDestacado.subscribers}
								<span>{canalDestacado.subscribers}</span>
							{/if}
							{#if canalDestacado.videoCount}
								<span class="before:content-['•'] before:mr-2">{canalDestacado.videoCount} videos</span>
							{/if}
						</div>
					</div>
				</div>
				
				<div class="flex items-center gap-3 z-10 w-full sm:w-auto justify-center">
					<button 
						onclick={toggleSuscribir}
						class="px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 w-36 {suscrito ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-white text-black hover:bg-zinc-200'}"
					>
						{suscrito ? 'Suscrito ✓' : 'Suscribirse'}
					</button>
					<button 
						onclick={irAlCanal}
						class="px-6 py-2.5 rounded-full font-bold text-sm bg-red-600 text-white hover:bg-red-500 transition-all duration-300 w-36 shadow-lg shadow-red-900/20"
					>
						Ir al canal
					</button>
				</div>
			</div>
		{/if}

		<!-- ── GRILLA DE VIDEOS / PLAYLISTS / SHORTS ── -->
		{#each resultados as item, i (item.id)}

			<!-- Renderizado condicional del carrusel de Shorts -->
			<!-- Lo mostramos en la posición 12 (i === 11) y luego cada 40 items -->
			{#if (i === 11 || (i > 11 && (i - 11) % 40 === 0)) && shortsCarrusel.length > 0}
				<div class="col-span-full">
					<ShortsCarousel shorts={shortsCarrusel} />
				</div>
			{/if}

			{#if item.type === 'Video'}
				<VideoCard {item} onSeleccionar={onSeleccionarVideo} />

			{:else if item.type === 'Short' || item.type === 'Reel'}
				<ShortCard {item} onSeleccionar={onSeleccionarVideo} />

			{:else if item.type === 'Playlist'}
				<PlaylistCard {item} />

			{:else if item.type === 'Channel'}
				<div class="col-span-full">
					<ChannelCard {item} />
				</div>
			{/if}

		{/each}

		<!-- Skeleton Loaders -->
		{#if buscando}
			{#each Array.from({ length: resultados.length === 0 ? 12 : 4 }) as _}
				<SkeletonLoader />
			{/each}
		{/if}

	</div>
</div>
