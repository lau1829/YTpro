<script>
	let { busqueda = $bindable(''), buscando = false, onBuscar, ocultarEnMovil = false } = $props();
</script>

<header 
	class="sticky top-0 max-sm:bg-black  z-40  px-4 py-4 flex items-center justify-center w-full"
	class:hidden={ocultarEnMovil}
	class:md:flex={ocultarEnMovil}
>


	<form on:submit|preventDefault={onBuscar} class="w-full max-w-2xl flex items-center">
		<div class="flex w-full items-center bg-zinc-950  border border-zinc-900 pr-5 rounded-full   transition-all duration-200 overflow-hidden">
			<input
				type="text"
				bind:value={busqueda}
				placeholder="Buscar videos en YouTube..."
				class="bg-transparent w-full px-5 py-4.5 text-zinc-100 placeholder-zinc-500 outline-none text-sm border-none focus:ring-0"
			/>
			<button 
				type="submit" 
				class=" active:bg-zinc-600 text-zinc-300  p-2   text-sm flex items-center justify-center gap-2 flex-shrink-0"
				disabled={buscando}
			>
			
					<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
			
			</button>
		</div>
	</form>
</header>
