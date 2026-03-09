<script lang="ts">
	import { zones, type Zone } from '$lib/data/zones';
	import { selectedZone, selectZone } from '$lib/stores/selectedZone';

	function handleZoneClick(zone: Zone): void {
		selectZone(zone);
	}

	function handleKeyDown(event: KeyboardEvent, zone: Zone): void {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleZoneClick(zone);
		}
	}

	// Définition des zones avec leurs positions en pourcentage sur l'image
	// Image: 7791 x 4500 pixels - Coordonnées converties en pourcentages
	const zoneOverlays = [
		{
			id: 'mirokai-experience',
			zone: zones[0],
			// Rectangle: 386,317 → 3081,2794
			path: 'M 4.95 7.04 L 4.95 62.09 L 39.54 62.09 L 39.54 7.04 Z',
			labelX: 22,
			labelY: 35,
			labelLines: ['MIROKAÏ', 'EXPERIENCE']
		},
		{
			id: 'spoon',
			zone: zones[1],
			// Polygone: 3087,988 → 5816,988 → 5818,1620 → 4777,3170 → 3087,3170
			path: 'M 39.62 21.96 L 74.65 21.96 L 74.68 36 L 61.31 70.44 L 39.62 70.44 Z',
			labelX: 52,
			labelY: 45,
			labelLines: ['ZONE PARTENAIRE', 'SPOON']
		},
		{
			id: 'regie',
			zone: zones[2],
			// Rectangle: 844,2790 → 1290,3270
			path: 'M 10.83 62 L 10.83 72.67 L 16.56 72.67 L 16.56 62 Z',
			labelX: 13.7,
			labelY: 67,
			labelLines: ['RÉGIE']
		},
		{
			id: 'cyclage',
			zone: zones[3],
			// Rectangle: 1287,2790 → 2172,4084
			path: 'M 16.52 62 L 16.52 90.76 L 27.88 90.76 L 27.88 62 Z',
			labelX: 22,
			labelY: 76,
			labelLines: ['SALLE DE', 'CYCLAGE']
		}
	];
</script>

<div class="map-container">
	<!-- Indicateur de niveau -->
	<div class="floor-indicator">
		<span class="floor-label">PLAN</span>
		<span class="floor-number">-1</span>
	</div>

	<!-- Légende -->
	<div class="legend">
		<div class="legend-title">Légende</div>
		<div class="legend-item">
			<span class="legend-dot active"></span>
			<span>Actif</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot maintenance"></span>
			<span>Maintenance</span>
		</div>
		<div class="legend-item">
			<span class="legend-dot inactive"></span>
			<span>Inactif</span>
		</div>
	</div>

	<!-- Image du plan en arrière-plan -->
	<div class="plan-wrapper">
		<img
			src="/plan-1.png"
			alt="Plan du niveau -1 - Centre Enchanted Tools"
			class="plan-image"
		/>

		<!-- SVG overlay pour les zones cliquables -->
		<svg
			viewBox="0 0 100 100"
			preserveAspectRatio="none"
			class="zones-overlay"
			role="img"
			aria-label="Zones interactives du plan"
		>
			{#each zoneOverlays as overlay}
				<g
					class="zone-interactive"
					class:selected={$selectedZone?.id === overlay.id}
					role="button"
					tabindex="0"
					aria-label={overlay.zone.nom}
					onclick={() => handleZoneClick(overlay.zone)}
					onkeydown={(e) => handleKeyDown(e, overlay.zone)}
				>
					<path
						d={overlay.path}
						fill={overlay.zone.couleur}
						fill-opacity={$selectedZone?.id === overlay.id ? 0.35 : 0.08}
						stroke={overlay.zone.couleur}
						stroke-width={$selectedZone?.id === overlay.id ? 0.4 : 0.15}
						class="zone-path"
					/>
					<!-- Indicateur de statut -->
					<circle
						cx={overlay.labelX + 8}
						cy={overlay.labelY - 6}
						r="1"
						class="status-indicator"
						class:active={overlay.zone.status === 'actif'}
						class:maintenance={overlay.zone.status === 'maintenance'}
						class:inactive={overlay.zone.status === 'inactif'}
					/>
				</g>
			{/each}
		</svg>
	</div>

	<!-- Info rapide de la zone sélectionnée -->
	{#if $selectedZone}
		<div class="quick-info">
			<div class="quick-info-dot" style="background: {$selectedZone.couleur}"></div>
			<span class="quick-info-name">{$selectedZone.nom}</span>
			<span class="quick-info-status" class:active={$selectedZone.status === 'actif'} class:maintenance={$selectedZone.status === 'maintenance'}>
				{$selectedZone.status}
			</span>
		</div>
	{/if}
</div>

<style>
	.map-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 550px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow: hidden;
	}

	.floor-indicator {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 10;
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		font-family: var(--font-mono);
		padding: 0.5rem 1rem;
		background: rgba(13, 17, 23, 0.85);
		backdrop-filter: blur(12px);
		border-radius: 1rem;
		border: 1px solid rgba(14, 170, 146, 0.2);
	}

	.floor-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--magic-turquoise);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.floor-number {
		font-size: 1.25rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-purple));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.legend {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		background: linear-gradient(135deg, rgba(21, 27, 35, 0.9) 0%, rgba(13, 17, 23, 0.95) 100%);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(158, 99, 165, 0.2);
		border-radius: 1rem;
		padding: 1rem 1.25rem;
		font-size: 0.75rem;
	}

	.legend-title {
		font-weight: 600;
		color: var(--magic-purple);
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-size: 0.625rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.legend-title::before {
		content: '✦';
		font-size: 0.5rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.375rem;
		font-size: 0.7rem;
	}

	.legend-item:last-child {
		margin-bottom: 0;
	}

	.legend-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		box-shadow: 0 0 8px currentColor;
	}

	.legend-dot.active { 
		background: var(--magic-turquoise); 
		color: var(--magic-turquoise);
	}
	.legend-dot.maintenance { 
		background: var(--magic-orange); 
		color: var(--magic-orange);
	}
	.legend-dot.inactive { 
		background: var(--magic-magenta); 
		color: var(--magic-magenta);
	}

	.plan-wrapper {
		position: relative;
		width: 100%;
		max-width: 1100px;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 
			0 4px 24px rgba(0, 0, 0, 0.4),
			0 0 60px rgba(14, 170, 146, 0.08),
			0 0 100px rgba(163, 51, 124, 0.05);
	}
	
	.plan-wrapper::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 1rem;
		padding: 1px;
		background: linear-gradient(135deg, rgba(14, 170, 146, 0.3), rgba(163, 51, 124, 0.2), rgba(158, 99, 165, 0.3));
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
		z-index: 5;
	}

	.plan-image {
		width: 100%;
		height: auto;
		display: block;
		user-select: none;
		pointer-events: none;
	}

	.zones-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.zone-path {
		cursor: pointer;
		transition: fill-opacity 0.2s ease, stroke-width 0.2s ease;
	}

	.zone-interactive:hover .zone-path {
		fill-opacity: 0.25;
		stroke-width: 0.3;
	}

	.zone-interactive.selected .zone-path {
		fill-opacity: 0.35;
		stroke-width: 0.4;
	}

	.zone-interactive:focus {
		outline: none;
	}

	.zone-interactive:focus .zone-path {
		stroke-width: 0.5;
		stroke-dasharray: 0.5 0.3;
	}

	.status-indicator {
		pointer-events: none;
		filter: drop-shadow(0 0 4px currentColor);
	}

	.status-indicator.active { fill: var(--magic-turquoise); }
	.status-indicator.maintenance { fill: var(--magic-orange); }
	.status-indicator.inactive { fill: var(--magic-magenta); }

	.quick-info {
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: linear-gradient(135deg, rgba(21, 27, 35, 0.92) 0%, rgba(13, 17, 23, 0.95) 100%);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(14, 170, 146, 0.25);
		border-radius: 2rem;
		padding: 0.625rem 1.25rem;
		font-size: 0.875rem;
		animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.quick-info-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 50%;
		box-shadow: 0 0 10px currentColor;
		animation: bioluminescence 2s ease-in-out infinite;
	}

	@keyframes bioluminescence {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 1; }
	}

	.quick-info-name {
		color: var(--color-text-primary);
		font-weight: 600;
	}

	.quick-info-status {
		text-transform: uppercase;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		padding: 0.25rem 0.625rem;
		border-radius: 1rem;
		background: var(--color-bg-tertiary);
		color: var(--color-text-muted);
	}

	.quick-info-status.active {
		background: rgba(14, 170, 146, 0.15);
		color: var(--magic-turquoise);
		border: 1px solid rgba(14, 170, 146, 0.3);
	}

	.quick-info-status.maintenance {
		background: rgba(240, 152, 3, 0.15);
		color: var(--magic-orange);
		border: 1px solid rgba(240, 152, 3, 0.3);
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Responsive */
	@media (max-width: 768px) {
		.map-container {
			padding: 0.5rem;
		}

		.legend {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.5rem 0.75rem;
		}

		.floor-indicator {
			bottom: 0.75rem;
			right: 0.75rem;
		}

		.quick-info {
			left: 0.5rem;
			bottom: 0.5rem;
			font-size: 0.75rem;
		}
	}
</style>
