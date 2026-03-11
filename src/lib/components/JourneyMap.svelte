<script lang="ts">
	import type { ModuleRow, MiniGameRow, JourneyNode, JourneyNodeType } from '$lib/supabase/types';
	import JourneyNodeComponent from './JourneyNode.svelte';

	interface Props {
		modules?: ModuleRow[];
		miniGames?: MiniGameRow[];
		currentNodeId?: string | null;
		completedNodeIds?: string[];
		backgroundUrl?: string | null;
		onNodeClick?: (node: JourneyNode) => void;
	}

	let { 
		modules = [], 
		miniGames = [],
		currentNodeId = null,
		completedNodeIds = [],
		backgroundUrl = null,
		onNodeClick
	}: Props = $props();

	// Détecter si on utilise une image de fond personnalisée
	const hasCustomBackground = $derived(!!backgroundUrl);

	// Construire les nœuds du parcours
	const journeyNodes = $derived.by(() => {
		const nodes: JourneyNode[] = [];

		// Trier les modules par ordre
		const sortedModules = [...modules]
			.filter(m => m.status === 'actif')
			.sort((a, b) => a.ordre - b.ordre);

		let nodeOrdre = 1;
		
		sortedModules.forEach((module) => {
			const moduleStatus = getNodeStatus(module.id, nodeOrdre);
			nodes.push({
				id: module.id,
				type: 'module' as JourneyNodeType,
				data: module,
				ordre: nodeOrdre,
				status: moduleStatus,
				position: module.position || { x: 50, y: 50 }
			});
			nodeOrdre++;

			// Chercher les mini-jeux après ce module
			const gamesAfter = miniGames
				.filter(g => g.after_module_id === module.id && g.status === 'actif')
				.sort((a, b) => a.ordre - b.ordre);

			gamesAfter.forEach(game => {
				const gameStatus = getNodeStatus(game.id, nodeOrdre);
				nodes.push({
					id: game.id,
					type: 'minigame' as JourneyNodeType,
					data: game,
					ordre: nodeOrdre,
					status: gameStatus,
					position: game.position || { x: 50, y: 50 }
				});
				nodeOrdre++;
			});
		});

		return nodes;
	});

	function getNodeStatus(nodeId: string, ordre: number): JourneyNode['status'] {
		if (currentNodeId === nodeId) return 'current';
		if (completedNodeIds.includes(nodeId)) return 'completed';
		
		if (ordre === 1 && !currentNodeId) return 'available';
		
		const prevCompleted = completedNodeIds.length >= ordre - 1;
		return prevCompleted ? 'available' : 'locked';
	}

	function handleNodeClick(node: JourneyNode) {
		if (node.status !== 'locked' && onNodeClick) {
			onNodeClick(node);
		}
	}

	function handleBackgroundLoaded() {
		// Quand l'image est chargée, on scrolle en bas de la page
		if (typeof window !== 'undefined') {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: 'auto'
			});
		}
	}
</script>

<div class="journey-container" class:has-custom-bg={hasCustomBackground}>
	<!-- Wrapper avec ratio fixe 9:16 pour que les positions correspondent -->
	<div class="journey-frame">
		<!-- Image de fond -->
		{#if hasCustomBackground}
			<img 
				src={backgroundUrl} 
				alt="Carte du parcours" 
				class="bg-image"
				on:load={handleBackgroundLoaded}
			/>
		{:else}
			<div class="bg-gradient"></div>
			<div class="floating-particles">
				{#each Array(12) as _, i}
					<div 
						class="particle" 
						style="
							--delay: {i * 0.5}s;
							--x: {10 + Math.random() * 80}%;
							--y: {10 + Math.random() * 80}%;
							--size: {3 + Math.random() * 4}px;
						"
					></div>
				{/each}
			</div>
		{/if}

		<!-- Nœuds positionnés sur la carte -->
		<div class="nodes-layer">
			{#each journeyNodes as node, i (node.id)}
				<div 
					class="node-wrapper"
					style="left: {node.position.x}%; top: {node.position.y}%;"
				>
					<JourneyNodeComponent 
						{node}
						index={i}
						onClick={() => handleNodeClick(node)}
					/>
				</div>
			{/each}
		</div>
	</div>

</div>

<style>
	/* Container - occupe la largeur dispo, la hauteur est définie par la carte (image) */
	.journey-container {
		width: 100%;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a2e; /* Fond sombre pour les bandes */
	}

	/* Frame - conteneur pour l'image et les nœuds, ratio 9:16 */
	.journey-frame {
		position: relative;
		width: min(100%, 900px);
		/* Hauteur auto basée sur l'image, pas de ratio forcé */
		height: auto;
		margin: 0 auto;
	}

	/* Image de fond - garde son ratio naturel, ajuste la largeur */
	.bg-image {
		display: block;
		width: 100%;
		height: auto;
	}

	/* Background généré */
	.bg-gradient {
		position: absolute;
		inset: 0;
		background: 
			radial-gradient(ellipse at 20% 30%, rgba(14, 170, 146, 0.15) 0%, transparent 50%),
			radial-gradient(ellipse at 80% 70%, rgba(163, 51, 124, 0.12) 0%, transparent 50%),
			radial-gradient(ellipse at 50% 100%, rgba(158, 99, 165, 0.1) 0%, transparent 40%),
			linear-gradient(180deg, rgba(13, 17, 23, 0.95) 0%, rgba(21, 27, 35, 0.98) 100%);
	}

	.floating-particles {
		position: absolute;
		inset: 0;
	}

	.particle {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background: var(--magic-turquoise);
		opacity: 0.4;
		animation: float 6s ease-in-out infinite;
		animation-delay: var(--delay);
		filter: blur(1px);
	}

	.particle:nth-child(even) {
		background: var(--magic-magenta);
	}

	.particle:nth-child(3n) {
		background: var(--magic-purple);
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0) scale(1);
			opacity: 0.4;
		}
		50% {
			transform: translateY(-20px) scale(1.2);
			opacity: 0.7;
		}
	}

	/* Couche des nœuds - se cale sur la taille du frame (donc de l'image) */
	.nodes-layer {
		position: absolute;
		inset: 0;
		z-index: 10;
	}

	.node-wrapper {
		position: absolute;
		transform: translate(-50%, -50%);
		z-index: 10;
	}
</style>
