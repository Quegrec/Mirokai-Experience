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
</script>

<div class="relative w-full h-full min-h-[500px] p-4">
	<!-- Titre du plan -->
	<div class="absolute top-4 left-4 z-10">
		<h2 class="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
			Plan d'étage
		</h2>
		<p class="text-sm text-[var(--color-text-muted)]">Enchanted Tools — Centre robotique</p>
	</div>

	<!-- Légende -->
	<div class="absolute top-4 right-4 z-10 glass rounded-lg p-3 text-xs">
		<div class="flex items-center gap-2 mb-1">
			<span class="w-2 h-2 rounded-full bg-green-500"></span>
			<span class="text-[var(--color-text-secondary)]">Actif</span>
		</div>
		<div class="flex items-center gap-2 mb-1">
			<span class="w-2 h-2 rounded-full bg-amber-500"></span>
			<span class="text-[var(--color-text-secondary)]">Maintenance</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="w-2 h-2 rounded-full bg-red-500"></span>
			<span class="text-[var(--color-text-secondary)]">Inactif</span>
		</div>
	</div>

	<!-- SVG Plan interactif -->
	<svg
		viewBox="0 0 800 600"
		class="w-full h-full"
		role="img"
		aria-label="Plan interactif du centre robotique"
	>
		<!-- Grille de fond -->
		<defs>
			<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
				<path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" stroke-width="0.5" opacity="0.3"/>
			</pattern>
		</defs>
		<rect width="100%" height="100%" fill="url(#grid)" />

		<!-- Cadre principal du bâtiment -->
		<rect
			x="50"
			y="50"
			width="700"
			height="500"
			fill="none"
			stroke="var(--color-border)"
			stroke-width="2"
			rx="8"
		/>

		<!-- Zone Mirokaï Experience -->
		<g
			class="zone-interactive cursor-pointer"
			role="button"
			tabindex="0"
			aria-label="Zone Mirokaï Experience"
			onclick={() => handleZoneClick(zones[0])}
			onkeydown={(e) => handleKeyDown(e, zones[0])}
		>
			<rect
				x="60"
				y="60"
				width="340"
				height="280"
				fill="var(--zone-mirokai)"
				fill-opacity={$selectedZone?.id === 'mirokai-experience' ? 0.4 : 0.15}
				stroke="var(--zone-mirokai)"
				stroke-width={$selectedZone?.id === 'mirokai-experience' ? 3 : 1.5}
				rx="6"
			/>
			<text x="230" y="190" text-anchor="middle" fill="var(--zone-mirokai)" font-size="18" font-weight="600">
				Mirokaï
			</text>
			<text x="230" y="215" text-anchor="middle" fill="var(--zone-mirokai)" font-size="14" opacity="0.8">
				Experience
			</text>
			<!-- Indicateur de status -->
			<circle cx="380" cy="80" r="6" fill="#10b981" />
		</g>

		<!-- Zone Spoon -->
		<g
			class="zone-interactive cursor-pointer"
			role="button"
			tabindex="0"
			aria-label="Zone Spoon"
			onclick={() => handleZoneClick(zones[1])}
			onkeydown={(e) => handleKeyDown(e, zones[1])}
		>
			<rect
				x="420"
				y="60"
				width="320"
				height="200"
				fill="var(--zone-spoon)"
				fill-opacity={$selectedZone?.id === 'spoon' ? 0.4 : 0.15}
				stroke="var(--zone-spoon)"
				stroke-width={$selectedZone?.id === 'spoon' ? 3 : 1.5}
				rx="6"
			/>
			<text x="580" y="155" text-anchor="middle" fill="var(--zone-spoon)" font-size="18" font-weight="600">
				Zone Spoon
			</text>
			<text x="580" y="180" text-anchor="middle" fill="var(--zone-spoon)" font-size="12" opacity="0.8">
				Service robotique
			</text>
			<circle cx="720" cy="80" r="6" fill="#10b981" />
		</g>

		<!-- Régie -->
		<g
			class="zone-interactive cursor-pointer"
			role="button"
			tabindex="0"
			aria-label="Régie"
			onclick={() => handleZoneClick(zones[2])}
			onkeydown={(e) => handleKeyDown(e, zones[2])}
		>
			<rect
				x="420"
				y="280"
				width="320"
				height="130"
				fill="var(--zone-regie)"
				fill-opacity={$selectedZone?.id === 'regie' ? 0.4 : 0.15}
				stroke="var(--zone-regie)"
				stroke-width={$selectedZone?.id === 'regie' ? 3 : 1.5}
				rx="6"
			/>
			<text x="580" y="350" text-anchor="middle" fill="var(--zone-regie)" font-size="18" font-weight="600">
				Régie
			</text>
			<text x="580" y="375" text-anchor="middle" fill="var(--zone-regie)" font-size="12" opacity="0.8">
				Centre de contrôle
			</text>
			<circle cx="720" cy="300" r="6" fill="#10b981" />
		</g>

		<!-- Salle de Cyclage -->
		<g
			class="zone-interactive cursor-pointer"
			role="button"
			tabindex="0"
			aria-label="Salle de Cyclage"
			onclick={() => handleZoneClick(zones[3])}
			onkeydown={(e) => handleKeyDown(e, zones[3])}
		>
			<rect
				x="60"
				y="360"
				width="340"
				height="180"
				fill="var(--zone-cyclage)"
				fill-opacity={$selectedZone?.id === 'cyclage' ? 0.4 : 0.15}
				stroke="var(--zone-cyclage)"
				stroke-width={$selectedZone?.id === 'cyclage' ? 3 : 1.5}
				rx="6"
			/>
			<text x="230" y="445" text-anchor="middle" fill="var(--zone-cyclage)" font-size="18" font-weight="600">
				Salle de Cyclage
			</text>
			<text x="230" y="470" text-anchor="middle" fill="var(--zone-cyclage)" font-size="12" opacity="0.8">
				Recharge & Maintenance
			</text>
			<!-- Status maintenance -->
			<circle cx="380" cy="380" r="6" fill="#f59e0b" />
		</g>

		<!-- Couloirs / Circulation -->
		<path
			d="M 400 200 L 400 430 L 420 430"
			fill="none"
			stroke="var(--color-text-muted)"
			stroke-width="1"
			stroke-dasharray="8 4"
			opacity="0.5"
		/>
		<path
			d="M 400 200 L 420 200"
			fill="none"
			stroke="var(--color-text-muted)"
			stroke-width="1"
			stroke-dasharray="8 4"
			opacity="0.5"
		/>
	</svg>
</div>
