<script lang="ts">
	interface Props {
		src: string;
		onTimeUpdate?: (currentTime: number, duration: number) => void;
	}

	let { src, onTimeUpdate }: Props = $props();

	let audioEl = $state<HTMLAudioElement | null>(null);
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let isDragging = $state(false);

	function togglePlay() {
		if (!audioEl) return;
		if (isPlaying) {
			audioEl.pause();
		} else {
			audioEl.play();
		}
	}

	function handleTimeUpdate() {
		if (!audioEl || isDragging) return;
		currentTime = audioEl.currentTime;
		duration = audioEl.duration || 0;
		onTimeUpdate?.(currentTime, duration);
	}

	function handleLoadedMetadata() {
		if (!audioEl) return;
		duration = audioEl.duration || 0;
	}

	function handleEnded() {
		isPlaying = false;
		currentTime = 0;
	}

	function handleSeek(e: Event) {
		if (!audioEl) return;
		const input = e.currentTarget as HTMLInputElement;
		const t = (Number(input.value) / 1000) * duration;
		audioEl.currentTime = t;
		currentTime = t;
	}

	function formatTime(s: number): string {
		if (!s || isNaN(s)) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	const progress = $derived(duration > 0 ? (currentTime / duration) * 1000 : 0);
</script>

<!-- Élément audio natif caché -->
<audio
	bind:this={audioEl}
	{src}
	ontimeupdate={handleTimeUpdate}
	onloadedmetadata={handleLoadedMetadata}
	onplay={() => (isPlaying = true)}
	onpause={() => (isPlaying = false)}
	onended={handleEnded}
	preload="metadata"
></audio>

<div class="player">
	<!-- Bouton play/pause -->
	<button class="play-btn" onclick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Lecture'}>
		{#if isPlaying}
			<!-- Icône pause -->
			<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
				<rect x="6" y="4" width="4" height="16" rx="1.5"/>
				<rect x="14" y="4" width="4" height="16" rx="1.5"/>
			</svg>
		{:else}
			<!-- Icône play -->
			<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
				<path d="M8 5.14v14l11-7-11-7z"/>
			</svg>
		{/if}
	</button>

	<!-- Barre de progression + temps -->
	<div class="player-right">
		<div class="time-row">
			<span class="time">{formatTime(currentTime)}</span>
			<span class="time time-total">{formatTime(duration)}</span>
		</div>

		<div class="progress-wrapper">
			<div class="progress-track">
				<div class="progress-fill" style="width: {(progress / 1000) * 100}%"></div>
			</div>
			<input
				type="range"
				min="0"
				max="1000"
				value={progress}
				class="progress-input"
				oninput={handleSeek}
				onmousedown={() => (isDragging = true)}
				onmouseup={() => (isDragging = false)}
				ontouchstart={() => (isDragging = true)}
				ontouchend={() => (isDragging = false)}
				aria-label="Position de lecture"
			/>
		</div>
	</div>
</div>

<style>
	.player {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0.75rem 1rem;
		background: rgba(15, 23, 42, 0.85);
		border: 1px solid rgba(14, 170, 162, 0.25);
		border-radius: 1.25rem;
		backdrop-filter: blur(8px);
	}

	/* Bouton play/pause */
	.play-btn {
		flex-shrink: 0;
		width: 46px;
		height: 46px;
		border-radius: 50%;
		border: none;
		background: linear-gradient(135deg, var(--magic-turquoise, #0EAAA2), var(--magic-magenta, #A3337C));
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(14, 170, 162, 0.45);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.play-btn:hover {
		transform: scale(1.07);
		box-shadow: 0 6px 20px rgba(14, 170, 162, 0.6);
	}

	.play-btn:active {
		transform: scale(0.96);
	}

	/* Partie droite */
	.player-right {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.time-row {
		display: flex;
		justify-content: space-between;
	}

	.time {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--magic-turquoise, #0EAAA2);
		font-variant-numeric: tabular-nums;
	}

	.time-total {
		color: rgba(148, 163, 184, 0.6);
	}

	/* Barre de progression */
	.progress-wrapper {
		position: relative;
		height: 20px;
		display: flex;
		align-items: center;
	}

	.progress-track {
		position: absolute;
		left: 0;
		right: 0;
		height: 4px;
		background: rgba(148, 163, 184, 0.2);
		border-radius: 2px;
		overflow: hidden;
		pointer-events: none;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--magic-turquoise, #0EAAA2), var(--magic-magenta, #A3337C));
		border-radius: 2px;
		transition: width 0.1s linear;
		box-shadow: 0 0 6px rgba(14, 170, 162, 0.5);
	}

	/* Input range invisible par-dessus la barre visible */
	.progress-input {
		position: absolute;
		left: 0;
		right: 0;
		width: 100%;
		height: 20px;
		opacity: 0;
		cursor: pointer;
		margin: 0;
	}
</style>
