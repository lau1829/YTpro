<script>
	import { onMount } from 'svelte';
	import VideoPlayer from 'svelte-video-player';
	
	let { 
		source, 
		poster, 
		initialTime = 0,
		onTimeUpdate = null,
		onPlayingChange = null,
		...props 
	} = $props();
	
	let playerContainer;
	let videoElement;
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
		
		// Buscar el elemento video después de que se monte
		setTimeout(() => {
			if (playerContainer) {
				videoElement = playerContainer.querySelector('video');
				if (videoElement && initialTime > 0) {
					videoElement.currentTime = initialTime;
					videoElement.play().catch(err => console.log('Autoplay prevented:', err));
				}
				
				// Escuchar cambios de tiempo y estado
				if (videoElement) {
					videoElement.addEventListener('timeupdate', () => {
						if (onTimeUpdate) {
							onTimeUpdate(videoElement.currentTime, !videoElement.paused);
						}
					});
					
					videoElement.addEventListener('play', () => {
						if (onPlayingChange) onPlayingChange(true);
					});
					
					videoElement.addEventListener('pause', () => {
						if (onPlayingChange) onPlayingChange(false);
					});
				}
			}
		}, 100);
	});
</script>

<div bind:this={playerContainer} class="w-full h-full">
	{#if mounted}
		<VideoPlayer 
			{source}
			{poster}
			{...props}
		/>
	{/if}
</div>
