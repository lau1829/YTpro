<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { cola = [], onEliminar, onReproducir, videoActual, colaExpandida = true, onToggleCola, onReordenar } = $props();
	
	let items = $state([]);
	
	// Sincronizar items con cola
	$effect(() => {
		items = cola.map((video, index) => ({ 
			id: video.id, 
			video,
			index 
		}));
	});

	function handleDndConsider(e) {
		items = e.detail.items;
	}

	function handleDndFinalize(e) {
		items = e.detail.items;
		// Notificar cambio de orden al padre
		if (onReordenar) {
			onReordenar(items.map(item => item.video));
		}
	}
</script>

<!-- Botón colapsable sticky -->
<button
	onclick={onToggleCola}
	class="w-full bg-zinc-950 px-4 py-3  flex items-center justify-between  top-0 z-10 hover:bg-zinc-800"
>
	<h3 class="text-sm font-semibold text-zinc-200 flex items-center gap-2">
		<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
		</svg>
		Cola de reproducción
	</h3>
	<div class="flex items-center gap-3">
		<span class="text-xs text-zinc-500">{cola.length + (videoActual ? 1 : 0)} video{(cola.length + (videoActual ? 1 : 0)) !== 1 ? 's' : ''}</span>
		<svg 
			class="w-5 h-5 text-zinc-400" 
			fill="none" 
			stroke="currentColor" 
			stroke-width="2" 
			viewBox="0 0 24 24"
			style="transform: rotate({colaExpandida ? '180deg' : '0deg'})"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
		</svg>
	</div>
</button>

<!-- Contenido colapsable -->
{#if !colaExpandida}
	<div class="w-full bg-zinc-950 divide-y divide-zinc-800">
		<!-- Video actual reproduciéndose -->
		{#if videoActual}
			<div class="flex gap-3 p-3 bg-blue-950/20 border-l-2 border-zinc-500">
				<!-- Indicador reproduciendo -->
				<div class="flex-shrink-0 w-6 flex items-center justify-center">
					<svg class="w-4 h-4 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z"/>
					</svg>
				</div>

				<!-- Miniatura -->
				<div class="flex-shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-zinc-800">
					<img 
						src={videoActual.thumbnail} 
						alt={videoActual.title}
						class="w-full h-full object-cover"
					/>
					{#if videoActual.raw?.length_text?.text}
						<span class="absolute bottom-1 right-1 bg-black/80 text-[10px] font-semibold text-white px-1 py-0.5 rounded">
							{videoActual.raw.length_text.text}
						</span>
					{/if}
				</div>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<div class="flex items-start gap-2 mb-1">
						<h4 class="text-sm text-zinc-100 line-clamp-2 leading-snug flex-1">
							{videoActual.title}
						</h4>
						<span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">
							Reproduciendo
						</span>
					</div>
					<p class="text-xs text-zinc-400">{videoActual.channel}</p>
				</div>
			</div>
		{/if}

		<!-- Videos en cola con drag & drop -->
		<div 
			use:dndzone={{items, flipDurationMs: 200, dropTargetStyle: {}}}
			onconsider={handleDndConsider}
			onfinalize={handleDndFinalize}
		>
			{#each items as item, idx (item.id)}
				<div 
					animate:flip={{duration: 200}}
					class="flex gap-3 p-3 hover:bg-zinc-900 group cursor-move"
				>
					<!-- Drag handle -->
					<div class="flex-shrink-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing">
						<svg class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 8h16M4 16h16"/>
						</svg>
					</div>

					<!-- Miniatura -->
					<button
						onclick={() => onReproducir(item.video)}
						class="flex-shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-zinc-800"
					>
						<img 
							src={item.video.thumbnail} 
							alt={item.video.title}
							class="w-full h-full object-cover group-hover:opacity-80"
						/>
						{#if item.video.raw?.length_text?.text}
							<span class="absolute bottom-1 right-1 bg-black/80 text-[10px] font-semibold text-white px-1 py-0.5 rounded">
								{item.video.raw.length_text.text}
							</span>
						{/if}
					</button>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<button
							onclick={() => onReproducir(item.video)}
							class="text-left w-full"
						>
							<h4 class="text-sm text-zinc-200 line-clamp-2 leading-snug mb-1 group-hover:text-white">
								{item.video.title}
							</h4>
							<p class="text-xs text-zinc-500">{item.video.channel}</p>
						</button>
					</div>

					<!-- Botón eliminar -->
					<button
						onclick={() => onEliminar(idx)}
						class="flex-shrink-0 p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100"
						title="Eliminar de la cola"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	</div>
{/if}
