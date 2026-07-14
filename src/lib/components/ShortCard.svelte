<script>
	let { item, onSeleccionar } = $props();
</script>

<button
	onclick={() => onSeleccionar?.(item)}
	class="flex flex-col text-left w-full group cursor-pointer focus:outline-none border-none rounded-2xl p-3 transition-all duration-300 hover:bg-zinc-900/50"
>
	<!-- Thumbnail vertical (9:16) -->
	<div class="relative w-full rounded-xl overflow-hidden bg-zinc-900" style="aspect-ratio: 9/16;">
		<img
			src={item.thumbnail}
			alt={item.title}
			class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			loading="lazy"
		/>

		<!-- Badge SHORTS -->
		<div class="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
			<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
				<path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.56-3.22 1.6-5.06s-3.22-2.56-5.06-1.6L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.71 2.28 3.3l1.2.5L6 14.94c-1.84.96-2.56 3.22-1.6 5.06.96 1.84 3.22 2.56 5.06 1.6l8.54-4.54c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.71-2.23-3.25z"/>
			</svg>
			Shorts
		</div>

		<!-- Duración si está disponible -->
		{#if item.raw?.duration?.text || item.raw?.length_text?.text}
			<span class="absolute bottom-2 right-2 bg-black/80 text-[11px] font-semibold text-white px-1.5 py-0.5 rounded">
				{item.raw?.duration?.text || item.raw?.length_text?.text}
			</span>
		{/if}

		<!-- Vistas sobre el video -->
		{#if item.views}
			<div class="absolute bottom-2 left-2 text-[11px] text-white/80 font-medium bg-black/50 px-1.5 py-0.5 rounded">
				{item.views}
			</div>
		{/if}
	</div>

	<!-- Info debajo -->
	<div class="mt-2 px-1">
		<h3 class="text-xs font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug">
			{item.title}
		</h3>
		{#if item.channel}
			<p class="text-[11px] text-zinc-500 mt-0.5 truncate">{item.channel}</p>
		{/if}
	</div>
</button>
