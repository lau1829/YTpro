<script>
	let { item } = $props();
</script>

<div class="flex items-center gap-4 w-full group rounded-2xl p-3 transition-all duration-300 hover:bg-zinc-900/50 cursor-default col-span-full">
	<!-- Avatar del canal -->
	<div class="relative flex-shrink-0">
		<div class="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-zinc-700 group-hover:ring-zinc-500 transition-all">
			{#if item.thumbnail}
				<img
					src={item.thumbnail}
					alt={item.title}
					class="w-full h-full object-cover"
					loading="lazy"
				/>
			{:else}
				<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-500">
					{item.title?.charAt(0) || 'C'}
				</div>
			{/if}
		</div>
	</div>

	<!-- Info del canal -->
	<div class="flex flex-col gap-1 min-w-0 flex-1">
		<div class="flex items-center gap-1.5">
			<h3 class="text-base font-bold text-zinc-100 group-hover:text-white truncate">{item.title}</h3>
			{#if item.verified}
				<svg class="w-4 h-4 text-zinc-400 fill-zinc-400 flex-shrink-0" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
				</svg>
			{/if}
		</div>

		<div class="flex items-center gap-2 text-xs text-zinc-500">
			{#if item.subscribers}
				<span>{item.subscribers} suscriptores</span>
			{/if}
			{#if item.videoCount}
				<span class="before:content-['•'] before:mr-2">{item.videoCount} videos</span>
			{/if}
		</div>
	</div>

	<!-- Badge -->
	<div class="flex-shrink-0 hidden sm:block">
		<span class="text-[10px] text-zinc-500 border border-zinc-700 px-2 py-1 rounded-full font-medium">Canal</span>
	</div>
</div>
