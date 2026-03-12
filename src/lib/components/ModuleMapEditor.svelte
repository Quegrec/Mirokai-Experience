<script lang="ts">
	import { Play, Hand, HelpCircle, Info, Sparkles, GripVertical, X } from 'lucide-svelte';
	import type { ModuleRow, ModulePosition } from '$lib/supabase/types';

	interface Props {
		modules: ModuleRow[];
		onPositionChange: (moduleId: string, position: ModulePosition | null) => void;
	}

	let { modules, onPositionChange }: Props = $props();

	let mapContainer: HTMLDivElement;
	let draggingModule: ModuleRow | null = $state(null);
	let dragOffset = $state({ x: 0, y: 0 });

	const typeIcons = {
		video: Play,
		interaction: Hand,
		quiz: HelpCircle,
		info: Info,
		experience: Sparkles
	};

	const typeColors = {
		video: 'var(--magic-turquoise)',
		interaction: 'var(--magic-purple)',
		quiz: 'var(--magic-orange)',
		info: 'var(--magic-blue)',
		experience: 'var(--magic-magenta)'
	};

	// Modules positionnés sur la carte
	const positionedModules = $derived(modules.filter(m => m.position !== null));
	
	// Modules non positionnés (dans le panneau latéral)
	const unpositionedModules = $derived(modules.filter(m => m.position === null && m.status === 'actif'));

	function handleDragStart(e: DragEvent, module: ModuleRow) {
		draggingModule = module;
		
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', module.id);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		
		if (!draggingModule || !mapContainer) return;

		const rect = mapContainer.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;

		// Limiter aux bordures
		const clampedX = Math.max(2, Math.min(98, x));
		const clampedY = Math.max(2, Math.min(98, y));

		onPositionChange(draggingModule.id, { x: clampedX, y: clampedY });
		draggingModule = null;
	}

	function handleDragEnd() {
		draggingModule = null;
	}

	function removeFromMap(moduleId: string) {
		onPositionChange(moduleId, null);
	}

	// Pour le drag des modules déjà sur la carte
	let isDraggingOnMap = $state(false);
	let draggedMapModule: ModuleRow | null = $state(null);

	function handleMapModuleMouseDown(e: MouseEvent, module: ModuleRow) {
		e.preventDefault();
		isDraggingOnMap = true;
		draggedMapModule = module;
		
		document.addEventListener('mousemove', handleMapModuleMouseMove);
		document.addEventListener('mouseup', handleMapModuleMouseUp);
	}

	function handleMapModuleMouseMove(e: MouseEvent) {
		if (!isDraggingOnMap || !draggedMapModule || !mapContainer) return;

		const rect = mapContainer.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;

		const clampedX = Math.max(2, Math.min(98, x));
		const clampedY = Math.max(2, Math.min(98, y));

		onPositionChange(draggedMapModule.id, { x: clampedX, y: clampedY });
	}

	function handleMapModuleMouseUp() {
		isDraggingOnMap = false;
		draggedMapModule = null;
		document.removeEventListener('mousemove', handleMapModuleMouseMove);
		document.removeEventListener('mouseup', handleMapModuleMouseUp);
	}
</script>

<div class="editor-container">
	<!-- Panneau des modules non positionnés -->
	<div class="modules-panel glass rounded-xl p-4">
		<h3 class="text-sm font-semibold text-(--color-text-primary) mb-3 flex items-center gap-2">
			<GripVertical size={16} class="text-(--magic-turquoise)" />
			Modules à placer
		</h3>
		
		{#if unpositionedModules.length === 0}
			<p class="text-xs text-(--color-text-muted) text-center py-4">
				Tous les modules actifs sont placés sur la carte
			</p>
		{:else}
			<div class="space-y-2">
				{#each unpositionedModules as module (module.id)}
					{@const Icon = typeIcons[module.type]}
					<div
						draggable="true"
						ondragstart={(e) => handleDragStart(e, module)}
						ondragend={handleDragEnd}
						class="module-chip flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all"
						style="--module-color: {typeColors[module.type]}"
					>
						<div class="w-6 h-6 rounded-md flex items-center justify-center" style="background: {typeColors[module.type]}20; color: {typeColors[module.type]}">
							<Icon size={14} />
						</div>
						<span class="text-xs text-(--color-text-primary) truncate flex-1">
							{module.nom}
						</span>
						<span class="text-[10px] text-(--color-text-muted)">
							{module.ordre}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mt-4 pt-4 border-t border-[var(--color-border)]">
			<p class="text-[10px] text-(--color-text-muted)">
				💡 Glissez-déposez les modules sur la carte pour les positionner
			</p>
		</div>
	</div>

	<!-- Carte interactive -->
	<div 
		class="map-area glass rounded-xl overflow-hidden"
		bind:this={mapContainer}
		ondragover={handleDragOver}
		ondrop={handleDrop}
		role="application"
		aria-label="Zone de placement des modules"
	>
		<div class="relative w-full h-full">
			<!-- Image du plan -->
			<img 
				src="/plan-1.png" 
				alt="Plan du niveau -1"
				class="w-full h-full object-contain pointer-events-none select-none"
				draggable="false"
			/>

			<!-- Modules positionnés -->
			{#each positionedModules as module (module.id)}
				{@const Icon = typeIcons[module.type]}
				{@const pos = module.position}
				{#if pos}
					<div
						class="absolute module-marker group"
						style="left: {pos.x}%; top: {pos.y}%; --module-color: {typeColors[module.type]}"
						onmousedown={(e) => handleMapModuleMouseDown(e, module)}
						role="button"
						tabindex="0"
						aria-label="Module {module.nom}"
					>
						<!-- Marqueur principal -->
						<div class="marker-icon">
							<Icon size={16} />
						</div>
						
						<!-- Tooltip au hover -->
						<div class="marker-tooltip">
							<span class="font-medium">{module.nom}</span>
							<span class="text-[10px] opacity-75">Ordre: {module.ordre}</span>
						</div>

						<!-- Bouton supprimer -->
						<button
							class="marker-remove"
							onclick={(e) => { e.stopPropagation(); removeFromMap(module.id); }}
							aria-label="Retirer de la carte"
						>
							<X size={12} />
						</button>
					</div>
				{/if}
			{/each}

			<!-- Indicateur de drop -->
			{#if draggingModule}
				<div class="drop-indicator">
					<span>Relâchez pour placer "{draggingModule.nom}"</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.editor-container {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 1rem;
		height: 500px;
	}

	.modules-panel {
		overflow-y: auto;
	}

	.module-chip {
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
	}

	.module-chip:hover {
		border-color: var(--module-color);
		box-shadow: 0 0 12px color-mix(in srgb, var(--module-color) 30%, transparent);
	}

	.module-chip:active {
		transform: scale(0.98);
		opacity: 0.8;
	}

	.map-area {
		position: relative;
		background: var(--color-bg-tertiary);
	}

	.module-marker {
		transform: translate(-50%, -50%);
		cursor: grab;
		z-index: 10;
	}

	.module-marker:active {
		cursor: grabbing;
		z-index: 20;
	}

	.marker-icon {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--module-color), color-mix(in srgb, var(--module-color) 70%, black));
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 16px color-mix(in srgb, var(--module-color) 40%, transparent);
		border: 2px solid white;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.module-marker:hover .marker-icon {
		transform: scale(1.15);
		box-shadow: 
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 24px color-mix(in srgb, var(--module-color) 60%, transparent);
	}

	.marker-tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 8px;
		padding: 6px 10px;
		background: rgba(13, 17, 23, 0.95);
		border: 1px solid var(--module-color);
		border-radius: 8px;
		white-space: nowrap;
		font-size: 11px;
		color: white;
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s, visibility 0.15s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		z-index: 30;
	}

	.module-marker:hover .marker-tooltip {
		opacity: 1;
		visibility: visible;
	}

	.marker-remove {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ef4444;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: scale(0.8);
		transition: opacity 0.15s, transform 0.15s;
		border: 2px solid white;
		cursor: pointer;
	}

	.module-marker:hover .marker-remove {
		opacity: 1;
		transform: scale(1);
	}

	.marker-remove:hover {
		background: #dc2626;
		transform: scale(1.1);
	}

	.drop-indicator {
		position: absolute;
		inset: 0;
		background: rgba(14, 170, 146, 0.1);
		border: 2px dashed var(--magic-turquoise);
		border-radius: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.drop-indicator span {
		background: rgba(13, 17, 23, 0.9);
		padding: 8px 16px;
		border-radius: 8px;
		color: var(--magic-turquoise);
		font-size: 12px;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.editor-container {
			grid-template-columns: 1fr;
			grid-template-rows: auto 400px;
			height: auto;
		}

		.modules-panel {
			max-height: 150px;
		}
	}
</style>
