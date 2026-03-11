<script lang="ts">
	import JourneyMap from '$lib/components/JourneyMap.svelte';
	import { Sparkles, Trophy, Clock, Gamepad2, ChevronRight, X, Menu } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { ModuleRow, MiniGameRow, JourneyNode, AppSettings } from '$lib/supabase/types';

	let { data } = $props();

	let modules = $state<ModuleRow[]>([]);
	let miniGames = $state<MiniGameRow[]>([]);
	let settings = $state<AppSettings | null>(null);
	let isLoading = $state(true);
	
	// Progression (stockée en sessionStorage - persiste pendant la session uniquement)
	let completedNodeIds = $state<string[]>([]);
	let currentNodeId = $state<string | null>(null);

	// Modal pour afficher les détails d'un nœud
	let selectedNode = $state<JourneyNode | null>(null);

	// Menu stats ouvert/fermé sur mobile
	let showStats = $state(false);

	// URL de fond du parcours
	const backgroundUrl = $derived(settings?.journey_background_url || null);

	// Statistiques calculées
	const totalDuration = $derived(
		modules
			.filter(m => m.status === 'actif')
			.reduce((acc, m) => acc + m.duree_estimee, 0) +
		miniGames
			.filter(g => g.status === 'actif')
			.reduce((acc, g) => acc + g.duree_estimee, 0)
	);

	const activeModulesCount = $derived(modules.filter(m => m.status === 'actif').length);
	const activeMiniGamesCount = $derived(miniGames.filter(g => g.status === 'actif').length);
	const totalNodes = $derived(activeModulesCount + activeMiniGamesCount);
	const progressPercent = $derived(totalNodes > 0 ? Math.round((completedNodeIds.length / totalNodes) * 100) : 0);

	// Charger les données
	onMount(async () => {
		if (data.supabase) {
			const [modulesRes, gamesRes, settingsRes] = await Promise.all([
				data.supabase
					.from('modules')
					.select('*')
					.order('ordre', { ascending: true }),
				data.supabase
					.from('mini_games')
					.select('*')
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

			// Charger la progression de session (si l'utilisateur a refresh la page)
			const savedProgress = sessionStorage.getItem('mirokai-progress');
			if (savedProgress) {
				try {
					const progress = JSON.parse(savedProgress);
					completedNodeIds = progress.completed || [];
					currentNodeId = progress.current || null;
				} catch (e) {
					console.error('Error loading progress:', e);
				}
			}
		}

		isLoading = false;
	});

	function handleNodeClick(node: JourneyNode) {
		selectedNode = node;
	}

	function closeModal() {
		selectedNode = null;
	}

	function startNode(node: JourneyNode) {
		if (!node.data) return;
		
		currentNodeId = node.id;
		saveProgress();
		closeModal();
	}

	function completeCurrentNode() {
		if (currentNodeId) {
			completedNodeIds = [...completedNodeIds, currentNodeId];
			currentNodeId = null;
			saveProgress();
			closeModal();
		}
	}

	function saveProgress() {
		sessionStorage.setItem('mirokai-progress', JSON.stringify({
			completed: completedNodeIds,
			current: currentNodeId
		}));
	}

	function resetProgress() {
		completedNodeIds = [];
		currentNodeId = null;
		sessionStorage.removeItem('mirokai-progress');
	}
</script>

<svelte:head>
	<title>Mirokaï Experience — Parcours</title>
	<meta name="description" content="Parcours interactif de l'expérience Mirokaï" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#0d1117" />
</svelte:head>

<div class="journey-page">
	<!-- SECTION 1: Header -->
	<header class="journey-header">
		<div class="header-left">
			<div class="logo-icon">
				<Sparkles size={20} />
			</div>
			<div class="header-title">
				<h1>Mirokaï</h1>
				<span class="progress-badge">{progressPercent}%</span>
			</div>
		</div>

		<button class="stats-toggle" onclick={() => showStats = !showStats}>
			<Menu size={20} />
		</button>

		<!-- Stats panel (dropdown) -->
		{#if showStats}
			<div class="stats-panel glass">
				<div class="progress-section">
					<div class="progress-info">
						<span class="progress-label">Progression</span>
						<span class="progress-value">{completedNodeIds.length} / {totalNodes}</span>
					</div>
					<div class="progress-bar-container">
						<div 
							class="progress-bar-fill"
							style="width: {progressPercent}%"
						></div>
					</div>
				</div>

				<div class="stat-row">
					<div class="stat-item">
						<Trophy size={16} class="text-[var(--magic-turquoise)]" />
						<span class="stat-value">{activeModulesCount}</span>
						<span class="stat-label">Modules</span>
					</div>
					<div class="stat-item">
						<Gamepad2 size={16} class="text-[var(--magic-magenta)]" />
						<span class="stat-value">{activeMiniGamesCount}</span>
						<span class="stat-label">Mini-jeux</span>
					</div>
					<div class="stat-item">
						<Clock size={16} class="text-[var(--magic-orange)]" />
						<span class="stat-value">{totalDuration}</span>
						<span class="stat-label">min</span>
					</div>
				</div>
				{#if completedNodeIds.length > 0}
					<button class="reset-btn" onclick={resetProgress}>
						Réinitialiser
					</button>
				{/if}
			</div>
		{/if}
	</header>

	<!-- SECTION 2: Carte (prend tout l'espace restant) -->
	<main class="journey-main">
		{#if isLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
			</div>
		{:else}
			<JourneyMap 
				{modules}
				{miniGames}
				{currentNodeId}
				{completedNodeIds}
				{backgroundUrl}
				onNodeClick={handleNodeClick}
			/>
		{/if}
	</main>
</div>

<!-- Modal de détails du nœud -->
{#if selectedNode}
	<div class="modal-overlay" onclick={closeModal} role="dialog" aria-modal="true">
		<div class="modal-content glass" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeModal} aria-label="Fermer">
				<X size={20} />
			</button>

			{#if selectedNode.data}
				{@const nodeData = selectedNode.data}
				<div class="modal-header">
					<div 
						class="modal-type-badge"
						class:is-minigame={selectedNode.type === 'minigame'}
					>
						{#if selectedNode.type === 'minigame'}
							<Gamepad2 size={14} />
							<span>Mini-jeu</span>
						{:else}
							<Sparkles size={14} />
							<span>Module</span>
						{/if}
					</div>
					<h2>{nodeData.nom}</h2>
					<p class="modal-duration">
						<Clock size={14} />
						{nodeData.duree_estimee} min
					</p>
				</div>

				<div class="modal-body">
					<p class="modal-description">{nodeData.description}</p>

					{#if 'contenu' in nodeData && nodeData.contenu}
						{#if nodeData.contenu.instructions}
							<div class="modal-instructions">
								<h4>Ce que vous allez faire :</h4>
								<ul>
									{#each nodeData.contenu.instructions as instruction}
										<li>{instruction}</li>
									{/each}
								</ul>
							</div>
						{/if}
					{/if}

					{#if selectedNode.type === 'minigame' && 'recompense' in nodeData && nodeData.recompense}
						<div class="modal-reward">
							<Trophy size={16} class="text-[var(--magic-orange)]" />
							<span>Récompense : {nodeData.recompense.points || 10} points</span>
						</div>
					{/if}
				</div>

				<div class="modal-actions">
					{#if selectedNode.status === 'completed'}
						<button class="btn-secondary" onclick={closeModal}>
							Déjà complété ✓
						</button>
					{:else if selectedNode.status === 'current'}
						<button class="btn-primary" onclick={completeCurrentNode}>
							Marquer comme terminé
						</button>
					{:else if selectedNode.status === 'available'}
						<button class="btn-primary" onclick={() => startNode(selectedNode!)}>
							Commencer
							<ChevronRight size={18} />
						</button>
					{:else}
						<button class="btn-locked" disabled>
							🔒 Terminez l'étape précédente
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ========================================
	   LAYOUT 3 SECTIONS: Header / Map / Footer
	   ======================================== */
	
	.journey-page {
		position: relative;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg-primary);
		/* On laisse la page défiler si la carte est plus grande que l'écran */
		overflow-x: hidden;
		overflow-y: auto;
	}

	/* SECTION 1: Header - hauteur fixe */
	.journey-header {
		position: relative;
		flex-shrink: 0;
		z-index: 100;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		padding-top: calc(0.5rem + env(safe-area-inset-top));
		background: var(--color-bg-primary);
		border-bottom: 1px solid var(--color-border);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-magenta));
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-title h1 {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
	}

	.progress-badge {
		padding: 0.2rem 0.5rem;
		border-radius: 1rem;
		background: rgba(14, 170, 146, 0.2);
		color: var(--magic-turquoise);
		font-size: 0.7rem;
		font-weight: 600;
	}

	.stats-toggle {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: var(--color-text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	/* Stats panel - dropdown sous le header */
	.stats-panel {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 99;
		padding: 1rem;
		margin: 0;
		border-radius: 0 0 1rem 1rem;
		animation: slideDown 0.2s ease;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-top: none;
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.progress-section {
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(93, 112, 133, 0.2);
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.progress-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.progress-value {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.progress-bar-container {
		height: 6px;
		background: rgba(93, 112, 133, 0.3);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--magic-turquoise), var(--magic-magenta));
		border-radius: 3px;
		transition: width 0.5s ease-out;
		box-shadow: 0 0 6px var(--magic-turquoise);
	}

	.stat-row {
		display: flex;
		justify-content: space-around;
		margin-bottom: 0.75rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.stat-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.reset-btn {
		width: 100%;
		padding: 0.5rem;
		background: rgba(163, 51, 124, 0.1);
		border: 1px solid rgba(163, 51, 124, 0.3);
		border-radius: 0.5rem;
		color: var(--magic-magenta);
		font-size: 0.75rem;
		cursor: pointer;
	}

	/* SECTION 2: Map - prend tout l'espace restant mais permet le scroll vertical */
	.journey-main {
		flex: 1;
		position: relative;
		/* On laisse le contenu définir la hauteur et on scrolle la page */
		overflow: visible;
	}

	.loading-state {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-border);
		border-top-color: var(--magic-turquoise);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* ========================================
	   MODAL - Mobile optimized
	   ======================================== */
	
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-end;
		z-index: 1000;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-content {
		width: 100%;
		max-height: 85vh;
		overflow-y: auto;
		border-radius: 1.5rem 1.5rem 0 0;
		padding: 1.5rem;
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
		position: relative;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-header {
		margin-bottom: 1rem;
		padding-right: 2.5rem;
	}

	.modal-type-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		background: rgba(14, 170, 146, 0.15);
		color: var(--magic-turquoise);
		margin-bottom: 0.75rem;
	}

	.modal-type-badge.is-minigame {
		background: rgba(240, 152, 3, 0.15);
		color: var(--magic-orange);
	}

	.modal-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0 0 0.5rem 0;
	}

	.modal-duration {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.modal-body {
		margin-bottom: 1.5rem;
	}

	.modal-description {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
	}

	.modal-instructions {
		background: rgba(14, 170, 146, 0.08);
		border: 1px solid rgba(14, 170, 146, 0.2);
		border-radius: 1rem;
		padding: 1rem;
	}

	.modal-instructions h4 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--magic-turquoise);
		margin: 0 0 0.75rem 0;
	}

	.modal-instructions ul {
		margin: 0;
		padding-left: 1.25rem;
	}

	.modal-instructions li {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.375rem;
	}

	.modal-reward {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: rgba(240, 152, 3, 0.1);
		border: 1px solid rgba(240, 152, 3, 0.2);
		border-radius: 0.75rem;
		font-size: 0.85rem;
		color: var(--magic-orange);
	}

	.modal-actions {
		display: flex;
	}

	.btn-primary {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-magenta));
		color: white;
		border: none;
		border-radius: 1rem;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
	}

	.btn-secondary {
		flex: 1;
		padding: 1rem;
		background: rgba(14, 170, 146, 0.1);
		color: var(--magic-turquoise);
		border: 1px solid var(--magic-turquoise);
		border-radius: 1rem;
		font-weight: 600;
		font-size: 1rem;
	}

	.btn-locked {
		flex: 1;
		padding: 1rem;
		background: rgba(93, 112, 133, 0.2);
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		font-size: 0.9rem;
	}

	/* ========================================
	   DESKTOP - Media queries
	   ======================================== */
	
	@media (min-width: 768px) {
		.journey-header {
			padding: 1rem 2rem;
		}

		.logo-icon {
			width: 44px;
			height: 44px;
		}

		.header-title h1 {
			font-size: 1.5rem;
		}

		.stats-panel {
			position: absolute;
			top: 1rem;
			right: 1rem;
			left: auto;
			width: auto;
			min-width: 300px;
			padding: 0.75rem 1.5rem;
		}

		.progress-section {
			margin-bottom: 0.75rem;
			padding-bottom: 0.5rem;
		}

		.stat-row {
			gap: 2rem;
			margin-bottom: 0;
		}

		.stat-item {
			flex-direction: row;
			gap: 0.5rem;
		}

		.reset-btn {
			display: none;
		}

		.modal-overlay {
			align-items: center;
			justify-content: center;
			padding: 2rem;
		}

		.modal-content {
			max-width: 480px;
			max-height: 80vh;
			border-radius: 1.5rem;
			animation: scaleIn 0.3s ease;
		}

		@keyframes scaleIn {
			from { opacity: 0; transform: scale(0.95); }
			to { opacity: 1; transform: scale(1); }
		}
	}
</style>
