<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { buscarVideos } from '$lib/utils/api.js';

	onMount(async () => {
		try {
			// Buscar tendencias de shorts usando una petición al endpoint YTpro con isShorts
			const res = await fetch('/YTpro', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isShorts: true })
			});
			const data = await res.json();
			const shorts = data.videos || [];
			if (shorts.length > 0) {
				goto(`/shorts/${shorts[0].id}`, { replaceState: true });
			} else {
				// Fallback si no hay shorts
				goto('/');
			}
		} catch (error) {
			console.error('Error al cargar shorts iniciales:', error);
			goto('/');
		}
	});
</script>

<div class="min-h-screen bg-black text-white flex flex-col items-center justify-center">
	<div class="flex flex-col items-center gap-3">
		<div class="w-10 h-10 rounded-full border-2 border-white/10 border-t-red-600 animate-spin"></div>
		<p class="text-sm font-medium text-zinc-400">Abriendo Shorts...</p>
	</div>
</div>
