<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import ReproductorFlotante from '$lib/components/ReproductorFlotante.svelte';

	let { children } = $props();
</script>

<svelte:head>
<title>YTpro</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap" rel="stylesheet">	
<link rel="icon" href={favicon} /></svelte:head>

{@render children()}

<!-- Reproductor flotante global: persiste en todas las páginas -->
<ReproductorFlotante />
