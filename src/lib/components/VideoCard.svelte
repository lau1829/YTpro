<script>
	import VideoMenu from './VideoMenu.svelte';
	let { item, onSeleccionar } = $props();
	
	// Array de 18 colores vibrantes para efecto glow aleatorio (estilo YouTube)
	const coloresGlow = [
		'#ef4444', // red-500
		'#f97316', // orange-500
		'#f59e0b', // amber-500
		'#eab308', // yellow-500
		'#84cc16', // lime-500
		'#22c55e', // green-500
		'#10b981', // emerald-500
		'#14b8a6', // teal-500
		'#06b6d4', // cyan-500
		'#0ea5e9', // sky-500
		'#3b82f6', // blue-500
		'#6366f1', // indigo-500
		'#8b5cf6', // violet-500
		'#a855f7', // purple-500
		'#d946ef', // fuchsia-500
		'#ec4899', // pink-500
		'#f43f5e', // rose-500
		'#fb923c'  // orange-400
	];
	
	// Asignar color basado en el ID del video (consistente pero aleatorio)
	function obtenerColor(id) {
		if (!id) return coloresGlow[0];
		const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
		return coloresGlow[hash % coloresGlow.length];
	}
	
	const colorGlow = obtenerColor(item.id);
</script>

<button
    onclick={() => onSeleccionar?.(item)}
    class="flex  relative flex-col text-left w-full group cursor-pointer focus:outline-none border-none p-4 rounded-3xl transition-all duration-500 hover:bg-zinc-950/30"
>
  <div class="relative w-full aspect-video mb-3 shadow-md">
        
        <!-- <img 
            src={item.thumbnail} 
            alt=""
            class="absolute inset-0 z-0 h-full w-full rounded-xl object-cover opacity-0 blur-2xl saturate-150 scale-105 transition-all duration-500 group-hover:opacity-80 pointer-events-none"
        /> -->
        
        <!-- Capa de color superpuesta -->
        <!-- <div 
            class="absolute inset-0 z-[1] h-full w-full rounded-xl opacity-0 blur-3xl scale-105 transition-all duration-500 group-hover:opacity-40 pointer-events-none"
            style="background: {colorGlow};"
        ></div> -->

        <div class="relative z-10 w-full h-full rounded-xl overflow-hidden bg-zinc-900">
            <img
                src={item.thumbnail}
                alt={item.title}
                title={item.raw?.snippets?.[0]?.text?.text || item.title}
                class="w-full h-full transition-all duration-500 object-cover group-hover:scale-105"
                loading="lazy"
                draggable="false"
           contextmenu="off"
            />

            {#if item.raw?.length_text?.text}
                <span class="absolute bottom-2 right-2 bg-black/80 text-[11px] font-semibold text-white px-1.5 py-0.5 rounded tracking-wide">
                    {item.raw.length_text.text}
                </span>
            {/if}
        </div>
    </div>

    <div class="flex gap-3 px-1 w-full">
        {#if item.raw?.author?.thumbnails?.[0]?.url}
            <img
                src={item.raw.author.thumbnails[0].url}
                alt=""
                class="w-9 h-9 rounded-full bg-zinc-800 object-cover flex-shrink-0 border border-zinc-800"
            />
        {:else}
            <div class="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs text-zinc-500 font-bold">
                {item.channel?.charAt(0) || 'Y'}
            </div>
        {/if}

        <div class="flex flex-col min-w-0 flex-1">
            <div class="flex items-start gap-2 mb-1">
                <h3 class="text-sm font-semibold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug flex-1" title={item.title}>
                    {item.title}
                </h3>
                <div class="flex-shrink-0 -mt-1">
                    <VideoMenu video={item} />
                </div>
            </div>

            <p class="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
                {item.channel}
                {#if item.raw?.author?.is_verified_artist || item.raw?.author?.is_verified}
                    <svg class="w-3.5 h-3.5 text-zinc-400 fill-zinc-400 flex-shrink-0" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                {/if}
            </p>

            <div class="text-xs text-zinc-500 flex items-center mt-0.5 gap-1">
                <span>{item.views || 'Sin vistas'}</span>
                {#if item.raw?.published?.text}
                    <span class="before:content-['•'] before:mr-1">
                        {item.raw.published.text}
                    </span>
                {/if}
            </div>
        </div>
    </div>
</button>






