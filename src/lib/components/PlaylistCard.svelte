<script>
	let { item } = $props();
</script>

<div class="flex flex-col text-left w-full group rounded-2xl p-3 transition-all duration-300 hover:bg-zinc-900/50 cursor-default">
	<!-- Thumbnail con overlay de conteo -->
	<div class="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
		<img
			src={item.thumbnail}
			alt={item.title}
			class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			loading="lazy"
		/>

		<!-- Overlay oscuro con cantidad de videos -->
		<div class="absolute inset-y-0 right-0 w-1/3 bg-black/80 flex flex-col items-center justify-center gap-1">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="text-white">
				<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
			</svg>
			<span class="text-white text-xs font-bold">{item.videoCount || '?'}</span>
			<span class="text-zinc-400 text-[10px]">videos</span>
		</div>

		<!-- Badge PLAYLIST -->
		<div class="absolute top-2 left-2 bg-zinc-800/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
			<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<path d="M9 18V5l12-2v13"/>
				<circle cx="6" cy="18" r="3"/>
				<circle cx="18" cy="16" r="3"/>
			</svg>
			Playlist
		</div>
	</div>

	<!-- Info -->
	<div class="mt-2.5 px-1 flex flex-col gap-0.5">
		<h3 class="text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug">
			{item.title}
		</h3>
		{#if item.channel}
			<p class="text-xs text-zinc-500 truncate">{item.channel}</p>
		{/if}
		{#if item.videoCount}
			<p class="text-xs text-zinc-600">{item.videoCount} videos</p>
		{/if}
	</div>
</div>
