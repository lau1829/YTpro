<script>
	import { goto } from '$app/navigation';
	import { videoMinimizado } from '$lib/stores/videoMinimizado.js';

	let { shorts = [] } = $props();

	function verShort(id) {
		// Aseguramos pausar cualquier reproductor activo antes de navegar
		videoMinimizado.cerrar();
		goto(`/shorts/${id}`);
	}
</script>

{#if shorts.length > 0}
	<div class="col-span-full my-6 bg-zinc-950/40 p-6 rounded-3xl border border-zinc-900">
		<div class="flex items-center gap-2 mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-500">
				<path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.71 2.28 3.3l1.2.5L6 14.94c-1.84.96-2.56 3.22-1.6 5.06.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.71-2.23-3.25z"/>
			</svg>
			<h2 class="text-lg font-bold text-white tracking-tight">Shorts destacados</h2>
		</div>

		<!-- Contenedor scroll horizontal -->
		<div class="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
			{#each shorts as item (item.id)}
				<button 
					onclick={() => verShort(item.id)}
					class="flex-shrink-0 w-36 sm:w-44 snap-start text-left group focus:outline-none"
				>
					<div class="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 shadow-md">
						<img 
							src={item.thumbnail} 
							alt={item.title} 
							class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
						/>
						
						<!-- Badge de Vistas -->
						{#if item.views}
							<div class="absolute bottom-2 left-2 text-[10px] text-white/90 font-bold bg-black/60 px-2 py-0.5 rounded-full">
								{item.views}
							</div>
						{/if}
					</div>
					
					<h3 class="mt-2 text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug px-1">
						{item.title}
					</h3>
				</button>
			{/each}
		</div>
	</div>
{/if}

<style>
	/* Scrollbar delgada y elegante */
	.scrollbar-thin::-webkit-scrollbar {
		height: 6px;
	}
	.scrollbar-thin::-webkit-scrollbar-track {
		background: transparent;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: #27272a;
		border-radius: 9999px;
	}
	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: #3f3f46;
	}
</style>
