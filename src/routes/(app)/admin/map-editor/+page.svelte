<script lang="ts">
	import { onMount } from 'svelte';
	import { Save, RotateCcw, Move, Eye, Loader2, Check, AlertTriangle, GripVertical } from 'lucide-svelte';
	import type { ModuleRow, MiniGameRow, ModulePosition, AppSettings } from '$lib/supabase/types';

	let { data } = $props();

	let modules = $state<ModuleRow[]>([]);
	let miniGames = $state<MiniGameRow[]>([]);
	let settings = $state<AppSettings | null>(null);
	let isLoading = $state(true);
	let isSaving = $state(false);
	let saveMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// État du drag
	let draggingId = $state<string | null>(null);
	let dragType = $state<'module' | 'minigame' | null>(null);

	// Positions modifiées (pour tracker les changements)
	let modifiedPositions = $state<Map<string, ModulePosition>>(new Map());

	// Référence du conteneur de la carte
	let mapContainer: HTMLDivElement;

	// Background URL
	const backgroundUrl = $derived(settings?.journey_background_url);

	onMount(async () => {
		if (data.supabase) {
			const [modulesRes, gamesRes, settingsRes] = await Promise.all([
				data.supabase
					.from('modules')
					.select('*')
					.eq('status', 'actif')
					.order('ordre', { ascending: true }),
				data.supabase
					.from('mini_games')
					.select('*')
					.eq('status', 'actif')
					.order('ordre', { ascending: true }),
				data.supabase
					.from('settings')
					.select('*')
					.eq('id', 'main')
					.single()
			]);

			if (modulesRes.data) modules = modulesRes.data;
			if (gamesRes.data) miniGames = gamesRes.data;
			if (settingsRes.data) settings = settingsRes.data;
		}
		isLoading = false;
	});

	// Commencer le drag
	function startDrag(e: MouseEvent | TouchEvent, id: string, type: 'module' | 'minigame') {
		e.preventDefault();
		draggingId = id;
		dragType = type;

		if (e instanceof MouseEvent) {
			window.addEventListener('mousemove', onDrag);
			window.addEventListener('mouseup', endDrag);
		} else {
			window.addEventListener('touchmove', onDrag);
			window.addEventListener('touchend', endDrag);
		}
	}

	// Pendant le drag
	function onDrag(e: MouseEvent | TouchEvent) {
		if (!draggingId || !mapContainer) return;

		const rect = mapContainer.getBoundingClientRect();
		let clientX: number, clientY: number;

		if (e instanceof MouseEvent) {
			clientX = e.clientX;
			clientY = e.clientY;
		} else {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		}

		// Calculer la position en pourcentage
		const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
		const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));

		const newPosition = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };

		// Mettre à jour la position
		if (dragType === 'module') {
			modules = modules.map(m => 
				m.id === draggingId ? { ...m, position: newPosition } : m
			);
		} else {
			miniGames = miniGames.map(g => 
				g.id === draggingId ? { ...g, position: newPosition } : g
			);
		}

		// Tracker la modification
		modifiedPositions.set(draggingId, newPosition);
		modifiedPositions = new Map(modifiedPositions);
	}

	// Fin du drag
	function endDrag() {
		draggingId = null;
		dragType = null;
		window.removeEventListener('mousemove', onDrag);
		window.removeEventListener('mouseup', endDrag);
		window.removeEventListener('touchmove', onDrag);
		window.removeEventListener('touchend', endDrag);
	}

	// Sauvegarder les positions
	async function savePositions() {
		if (!data.supabase || modifiedPositions.size === 0) return;

		isSaving = true;
		saveMessage = null;

		try {
			// Sauvegarder les modules modifiés
			for (const [id, position] of modifiedPositions) {
				const module = modules.find(m => m.id === id);
				if (module) {
					await data.supabase
						.from('modules')
						.update({ position })
						.eq('id', id);
				} else {
					const game = miniGames.find(g => g.id === id);
					if (game) {
						await data.supabase
							.from('mini_games')
							.update({ position })
							.eq('id', id);
					}
				}
			}

			modifiedPositions = new Map();
			saveMessage = { type: 'success', text: 'Positions sauvegardées !' };
		} catch (err) {
			saveMessage = { type: 'error', text: 'Erreur lors de la sauvegarde' };
		}

		isSaving = false;
	}

	// Réinitialiser les positions non sauvegardées
	async function resetPositions() {
		if (!data.supabase) return;

		isLoading = true;
		const [modulesRes, gamesRes] = await Promise.all([
			data.supabase
				.from('modules')
				.select('*')
				.eq('status', 'actif')
				.order('ordre', { ascending: true }),
			data.supabase
				.from('mini_games')
				.select('*')
				.eq('status', 'actif')
				.order('ordre', { ascending: true })
		]);

		if (modulesRes.data) modules = modulesRes.data;
		if (gamesRes.data) miniGames = gamesRes.data;
		modifiedPositions = new Map();
		isLoading = false;
	}

	// Obtenir l'icône selon le type de module
	function getModuleIcon(type: string): string {
		switch (type) {
			case 'video': return '🎬';
			case 'interaction': return '🤝';
			case 'quiz': return '❓';
			case 'info': return 'ℹ️';
			case 'experience': return '✨';
			default: return '📍';
		}
	}

	function getMiniGameIcon(type: string): string {
		switch (type) {
			case 'memory': return '🧠';
			case 'puzzle': return '🧩';
			case 'quiz_flash': return '⚡';
			case 'drag_drop': return '🎯';
			case 'observation': return '👁️';
			default: return '🎮';
		}
	}

	const hasChanges = $derived(modifiedPositions.size > 0);
</script>

<div class="map-editor">
	<!-- Header -->
	<div class="editor-header">
		<div>
			<h1 class="editor-title">Éditeur de carte</h1>
			<p class="editor-subtitle">
				Glissez-déposez les modules sur la carte
			</p>
		</div>

		<div class="editor-actions">
			{#if hasChanges}
				<span class="changes-badge">
					{modifiedPositions.size} modif.
				</span>
			{/if}
			
			<button
				onclick={resetPositions}
				disabled={!hasChanges || isSaving}
				class="btn-reset"
			>
				<RotateCcw size={16} />
				<span class="btn-text">Annuler</span>
			</button>

			<button
				onclick={savePositions}
				disabled={!hasChanges || isSaving}
				class="btn-save"
			>
				{#if isSaving}
					<Loader2 size={16} class="animate-spin" />
				{:else}
					<Save size={16} />
				{/if}
				<span class="btn-text">Sauvegarder</span>
			</button>
		</div>
	</div>

	{#if saveMessage}
		<div 
			class="mb-4 p-4 rounded-xl flex items-center gap-3 {saveMessage.type === 'success' ? 'bg-[var(--magic-turquoise)]/10 border border-[var(--magic-turquoise)]/30' : 'bg-red-500/10 border border-red-500/30'}"
		>
			{#if saveMessage.type === 'success'}
				<Check size={18} class="text-[var(--magic-turquoise)]" />
				<span class="text-[var(--magic-turquoise)]">{saveMessage.text}</span>
			{:else}
				<AlertTriangle size={18} class="text-red-400" />
				<span class="text-red-400">{saveMessage.text}</span>
			{/if}
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center h-[600px]">
			<Loader2 size={32} class="animate-spin text-[var(--magic-turquoise)]" />
		</div>
	{:else}
		<div class="editor-content">
			<!-- Carte -->
			<div class="map-container glass" bind:this={mapContainer}>
				<!-- Fond -->
				{#if backgroundUrl}
					<img 
						src={backgroundUrl} 
						alt="Carte du parcours" 
						class="map-background"
						draggable="false"
					/>
				{:else}
					<div class="map-placeholder">
						<p class="text-[var(--color-text-muted)]">Aucune image de fond définie</p>
						<a href="/admin/settings" class="text-[var(--magic-turquoise)] hover:underline text-sm mt-2">
							→ Configurer dans les paramètres
						</a>
					</div>
				{/if}

				<!-- Modules -->
				{#each modules as module (module.id)}
					{@const pos = module.position || { x: 50, y: 50 }}
					{@const isModified = modifiedPositions.has(module.id)}
					<div
						class="map-node module-node"
						class:dragging={draggingId === module.id}
						class:modified={isModified}
						style="left: {pos.x}%; top: {pos.y}%;"
						onmousedown={(e) => startDrag(e, module.id, 'module')}
						ontouchstart={(e) => startDrag(e, module.id, 'module')}
						role="button"
						tabindex="0"
					>
						<div class="node-handle">
							<GripVertical size={12} />
						</div>
						<span class="node-icon">{getModuleIcon(module.type)}</span>
						<span class="node-order">{module.ordre}</span>
						<div class="node-tooltip">
							<strong>{module.nom}</strong>
						</div>
					</div>
				{/each}

				<!-- Mini-jeux -->
				{#each miniGames as game (game.id)}
					{@const pos = game.position || { x: 50, y: 50 }}
					{@const isModified = modifiedPositions.has(game.id)}
					<div
						class="map-node minigame-node"
						class:dragging={draggingId === game.id}
						class:modified={isModified}
						style="left: {pos.x}%; top: {pos.y}%;"
						onmousedown={(e) => startDrag(e, game.id, 'minigame')}
						ontouchstart={(e) => startDrag(e, game.id, 'minigame')}
						role="button"
						tabindex="0"
					>
						<div class="node-handle">
							<GripVertical size={12} />
						</div>
						<span class="node-icon">{getMiniGameIcon(game.type)}</span>
						<div class="node-tooltip">
							<strong>{game.nom}</strong>
						</div>
					</div>
				{/each}
			</div>

			<!-- Liste des éléments -->
			<div class="elements-list glass">
				<h3 class="font-semibold text-[var(--color-text-primary)] mb-4">Éléments</h3>
				
				<div class="space-y-2">
					<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Modules ({modules.length})</p>
					{#each modules as module (module.id)}
						<div class="element-item" class:modified={modifiedPositions.has(module.id)}>
							<span class="element-icon">{getModuleIcon(module.type)}</span>
							<span class="element-name">{module.nom}</span>
							<span class="element-order">#{module.ordre}</span>
						</div>
					{/each}
				</div>

				{#if miniGames.length > 0}
					<div class="space-y-2 mt-4">
						<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Mini-jeux ({miniGames.length})</p>
						{#each miniGames as game (game.id)}
							<div class="element-item minigame" class:modified={modifiedPositions.has(game.id)}>
								<span class="element-icon">{getMiniGameIcon(game.type)}</span>
								<span class="element-name">{game.nom}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* ========================================
	   MOBILE FIRST
	   ======================================== */
	
	.map-editor {
		padding: 0;
	}

	.editor-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.editor-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.editor-subtitle {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.editor-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.changes-badge {
		font-size: 0.75rem;
		color: var(--magic-orange);
		padding: 0.25rem 0.5rem;
		background: rgba(240, 152, 3, 0.1);
		border-radius: 0.5rem;
	}

	.btn-reset,
	.btn-save {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-reset {
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
	}

	.btn-reset:hover:not(:disabled) {
		background: var(--color-bg-secondary);
	}

	.btn-reset:disabled,
	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-save {
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-magenta));
		border: none;
		color: white;
	}

	.btn-save:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.btn-text {
		display: none;
	}

	.editor-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Carte - même comportement visuel que le JourneyMap visiteur */
	.map-container {
		position: relative;
		width: min(100%, 900px);
		border-radius: 1rem;
		overflow: hidden;
		cursor: crosshair;
		background: #1a1a2e;
		margin: 0 auto;
	}

	.map-background {
		display: block;
		width: 100%;
		height: auto; /* garde le ratio naturel de l'image */
		pointer-events: none;
		user-select: none;
	}

	.map-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--color-bg-tertiary);
	}

	/* Nœuds sur la carte */
	.map-node {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		transition: transform 0.1s ease, box-shadow 0.2s ease;
		z-index: 10;
	}

	.map-node:hover {
		z-index: 20;
	}

	.map-node:hover .node-tooltip {
		opacity: 1;
		visibility: visible;
		transform: translate(-50%, 0);
	}

	.map-node.dragging {
		cursor: grabbing;
		z-index: 100;
		transform: translate(-50%, -50%) scale(1.1);
	}

	.map-node.modified {
		box-shadow: 0 0 0 3px var(--magic-orange);
	}

	.module-node {
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-purple));
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.minigame-node {
		background: linear-gradient(135deg, var(--magic-magenta), var(--magic-orange));
		border: 3px solid white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		width: 40px;
		height: 40px;
	}

	.node-icon {
		font-size: 1.25rem;
	}

	.minigame-node .node-icon {
		font-size: 1rem;
	}

	.node-order {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-bg-primary);
		border: 2px solid var(--magic-turquoise);
		font-size: 0.65rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-primary);
	}

	.node-handle {
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		opacity: 0;
		color: white;
		transition: opacity 0.2s ease;
	}

	.map-node:hover .node-handle {
		opacity: 0.7;
	}

	.node-tooltip {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%) translateY(4px);
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
		white-space: nowrap;
		font-size: 0.75rem;
		color: var(--color-text-primary);
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	/* Liste des éléments - mobile: collapsée */
	.elements-list {
		padding: 0.75rem;
		border-radius: 0.75rem;
		max-height: 30vh;
		overflow-y: auto;
	}

	.elements-list h3 {
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.element-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-bg-tertiary);
		font-size: 0.75rem;
	}

	.element-item.modified {
		border-left: 3px solid var(--magic-orange);
	}

	.element-item.minigame {
		background: rgba(163, 51, 124, 0.1);
	}

	.element-icon {
		font-size: 1rem;
	}

	.element-name {
		flex: 1;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.element-order {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	/* ========================================
	   DESKTOP
	   ======================================== */
	
	@media (min-width: 900px) {
		.editor-header {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 1.5rem;
		}

		.editor-title {
			font-size: 1.5rem;
		}

		.editor-actions {
			gap: 0.75rem;
		}

		.btn-reset,
		.btn-save {
			padding: 0.625rem 1rem;
		}

		.btn-text {
			display: inline;
		}

		.editor-content {
			display: grid;
			grid-template-columns: 1fr 280px;
			gap: 1.5rem;
		}

		/* même largeur max qu'en mode visiteur (déjà géré par min(100%, 900px)) */

		.elements-list {
			max-height: 70vh;
			padding: 1rem;
		}

		.element-item {
			font-size: 0.8rem;
		}
	}
</style>
