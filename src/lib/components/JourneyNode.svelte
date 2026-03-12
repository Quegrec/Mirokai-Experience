<script lang="ts">
	import { Play, Hand, HelpCircle, Info, Sparkles, Gamepad2, Lock, Check, Trophy, Star, Zap, Brain, Puzzle, Shapes } from 'lucide-svelte';
	import type { JourneyNode, ModuleRow, MiniGameRow, ModuleType, MiniGameType } from '$lib/supabase/types';

	interface Props {
		node: JourneyNode;
		index: number;
		onClick?: () => void;
	}

	let { node, index, onClick }: Props = $props();

	// Icônes par type de module
	const moduleIcons = {
		video: Play,
		interaction: Hand,
		quiz: HelpCircle,
		info: Info,
		experience: Sparkles
	};

	// Icônes par type de mini-jeu
	const miniGameIcons = {
		memory: Brain,
		puzzle: Puzzle,
		quiz_flash: Zap,
		drag_drop: Shapes,
		find_difference: Info,
		sequence: Shapes
	};

	// Couleurs par type
	const moduleColors = {
		video: 'var(--magic-turquoise)',
		interaction: 'var(--magic-purple)',
		quiz: 'var(--magic-orange)',
		info: 'var(--magic-blue)',
		experience: 'var(--magic-magenta)'
	};

	const miniGameColors = {
		memory: 'var(--magic-purple)',
		puzzle: 'var(--magic-blue)',
		quiz_flash: 'var(--magic-orange)',
		drag_drop: 'var(--magic-turquoise)',
		find_difference: 'var(--magic-magenta)',
		sequence: 'var(--magic-purple)'
	};

	// Récupérer l'icône et la couleur
	const nodeIcon = $derived.by(() => {
		if (node.type === 'start') return Star;
		if (node.type === 'end') return Trophy;
		if (node.type === 'minigame') {
			const game = node.data as MiniGameRow;
			return miniGameIcons[game.type] || Gamepad2;
		}
		if (node.type === 'module') {
			const mod = node.data as ModuleRow;
			return moduleIcons[mod.type] || Info;
		}
		return Info;
	});

	const nodeColor = $derived.by(() => {
		if (node.type === 'start') return 'var(--magic-turquoise)';
		if (node.type === 'end') return 'var(--magic-orange)';
		if (node.type === 'minigame') {
			const game = node.data as MiniGameRow;
			return miniGameColors[game.type] || 'var(--magic-purple)';
		}
		if (node.type === 'module') {
			const mod = node.data as ModuleRow;
			return moduleColors[mod.type] || 'var(--magic-turquoise)';
		}
		return 'var(--magic-turquoise)';
	});

	const nodeName = $derived.by(() => {
		if (node.type === 'start') return 'Départ';
		if (node.type === 'end') return 'Arrivée';
		if (node.data) return node.data.nom;
		return '';
	});

	const nodeSize = $derived.by(() => {
		if (node.type === 'start' || node.type === 'end') return 'medium';
		if (node.type === 'minigame') return 'small';
		return 'large';
	});

	// Calcul de la position du label pour éviter qu'il sorte de l'écran
	const labelPosition = $derived.by(() => {
		const pos = node.position || { x: 50, y: 50 };
		
		// Si le nœud est trop bas (> 70%), afficher le label au-dessus
		const showAbove = pos.y > 70;
		
		// Ajuster l'alignement horizontal si trop près des bords
		let align: 'center' | 'left' | 'right' = 'center';
		if (pos.x < 20) align = 'left';
		else if (pos.x > 80) align = 'right';
		
		return { showAbove, align };
	});

	function handleClick() {
		if (node.status !== 'locked' && onClick) {
			onClick();
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<button
	class="journey-node {nodeSize}"
	class:locked={node.status === 'locked'}
	class:available={node.status === 'available'}
	class:current={node.status === 'current'}
	class:completed={node.status === 'completed'}
	class:is-minigame={node.type === 'minigame'}
	class:is-special={node.type === 'start' || node.type === 'end'}
	style="--node-color: {nodeColor}; --animation-delay: {index * 0.1}s"
	onclick={handleClick}
	onkeydown={handleKeyDown}
	disabled={node.status === 'locked'}
	aria-label="{nodeName} - {node.status === 'locked' ? 'Verrouillé' : node.status === 'completed' ? 'Complété' : 'Disponible'}"
>
	<!-- Effet de lueur -->
	{#if node.status === 'current'}
		<div class="pulse-ring"></div>
		<div class="pulse-ring delay"></div>
	{/if}

	<!-- Corps du nœud -->
	<div class="node-body">
		<!-- Icône de statut (verrou ou check) -->
		{#if node.status === 'locked'}
			<div class="status-overlay">
				<Lock size={16} />
			</div>
		{:else if node.status === 'completed'}
			<div class="status-badge">
				<Check size={12} strokeWidth={3} />
			</div>
		{/if}

		<!-- Icône principale -->
		{#if node.type === 'module'}
			<div class="module-icon-wrapper">
				<img
					src={node.status === 'locked' ? '/icons/module_inactive.svg' : '/icons/module_active.svg'}
					alt={nodeName}
					class="module-icon-svg"
					loading="lazy"
				/>
				<span class="module-number">{node.ordre}</span>
			</div>
		{:else}
			<div class="node-icon">
				{#if nodeSize === 'large'}
					<svelte:component this={nodeIcon} size={24} />
				{:else if nodeSize === 'medium'}
					<svelte:component this={nodeIcon} size={20} />
				{:else}
					<svelte:component this={nodeIcon} size={16} />
				{/if}
			</div>
		{/if}
	</div>

	<!-- Numéro d'ordre (pour les autres types) -->
	{#if node.type !== 'module' && node.status !== 'locked'}
		<span class="node-order">{node.ordre}</span>
	{/if}

	<!-- Label (affiché au hover ou si c'est le nœud courant) -->
	<div 
		class="node-label"
		class:label-above={labelPosition.showAbove}
		class:label-left={labelPosition.align === 'left'}
		class:label-right={labelPosition.align === 'right'}
	>
		<span class="label-text">{nodeName}</span>
		{#if node.data && 'duree_estimee' in node.data}
			<span class="label-duration">{node.data.duree_estimee} min</span>
		{/if}
	</div>

	<!-- Mini badge pour les mini-jeux -->
	{#if node.type === 'minigame'}
		<div class="minigame-badge">
			<Gamepad2 size={10} />
		</div>
	{/if}
</button>

<style>
	.journey-node {
		position: relative;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		animation: nodeAppear 0.5s ease-out backwards;
		animation-delay: var(--animation-delay);
		transition: transform 0.2s ease;
	}

	.journey-node:not(.locked):hover {
		transform: scale(1.1);
	}

	.journey-node:not(.locked):active {
		transform: scale(0.95);
	}

	.journey-node.locked {
		cursor: not-allowed;
		opacity: 0.6;
	}

	@keyframes nodeAppear {
		from {
			opacity: 0;
			transform: scale(0) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* Tailles des nœuds */
	.journey-node.large .node-body {
		width: 60px;
		height: 60px;
	}

	.journey-node.medium .node-body {
		width: 50px;
		height: 50px;
	}

	.journey-node.small .node-body {
		width: 42px;
		height: 42px;
	}

	/* Corps du nœud */
	.node-body {
		position: relative;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
		border: 3px solid var(--color-border);
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.05);
		transition: all 0.3s ease;
	}

	/* Icône module (SVG personnalisé) */
	.module-icon-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.module-icon-svg {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.module-number {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		font-size: 0.80rem;
		color: #ffffff;
		text-shadow:
			0 0 6px rgba(0, 0, 0, 0.7),
			0 2px 4px rgba(0, 0, 0, 0.8);
		pointer-events: none;
		/* Légère compensation pour le volume 3D du SVG */
		transform: translateY(-4px);
	}

	/* États */
	.journey-node.available .node-body {
		border-color: var(--node-color);
		box-shadow: 
			0 4px 16px rgba(0, 0, 0, 0.3),
			0 0 20px color-mix(in srgb, var(--node-color) 30%, transparent);
	}

	.journey-node.current .node-body {
		border-color: var(--node-color);
		background: linear-gradient(135deg, 
			color-mix(in srgb, var(--node-color) 20%, var(--color-bg-secondary)) 0%, 
			color-mix(in srgb, var(--node-color) 10%, var(--color-bg-tertiary)) 100%
		);
		box-shadow: 
			0 4px 20px rgba(0, 0, 0, 0.4),
			0 0 30px color-mix(in srgb, var(--node-color) 50%, transparent),
			inset 0 0 15px color-mix(in srgb, var(--node-color) 20%, transparent);
	}

	.journey-node.completed .node-body {
		border-color: var(--magic-turquoise);
		background: linear-gradient(135deg, 
			rgba(14, 170, 146, 0.2) 0%, 
			rgba(14, 170, 146, 0.1) 100%
		);
	}

	.journey-node.is-special .node-body {
		background: linear-gradient(135deg, var(--node-color) 0%, color-mix(in srgb, var(--node-color) 70%, black) 100%);
		border-color: white;
	}

	.journey-node.is-minigame .node-body {
		border-radius: 12px;
		border-style: dashed;
	}

	/* Icône */
	.node-icon {
		color: var(--color-text-muted);
		transition: color 0.3s ease;
	}

	.journey-node.available .node-icon,
	.journey-node.current .node-icon {
		color: var(--node-color);
	}

	.journey-node.completed .node-icon {
		color: var(--magic-turquoise);
	}

	.journey-node.is-special .node-icon {
		color: white;
	}

	/* Animation de pulsation pour le nœud courant */
	.pulse-ring {
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		border: 2px solid var(--node-color);
		animation: pulse 2s ease-out infinite;
		opacity: 0;
	}

	.pulse-ring.delay {
		animation-delay: 1s;
	}

	.journey-node.is-minigame .pulse-ring {
		border-radius: 16px;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.8);
			opacity: 0.8;
		}
		100% {
			transform: scale(1.4);
			opacity: 0;
		}
	}

	/* Overlay de verrouillage */
	.status-overlay {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: rgba(13, 17, 23, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
	}

	/* Badge de complétion */
	.status-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--magic-turquoise);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		border: 2px solid var(--color-bg-primary);
		box-shadow: 0 2px 8px rgba(14, 170, 146, 0.5);
	}

	/* Numéro d'ordre */
	.node-order {
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--node-color);
		color: white;
		font-size: 10px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 8px;
		border: 2px solid var(--color-bg-primary);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	/* Label - par défaut en dessous, centré */
	.node-label {
		position: absolute;
		top: calc(100% + 12px);
		left: 50%;
		transform: translateX(-50%) translateY(-5px);
		text-align: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease, transform 0.2s ease;
		background: rgba(13, 17, 23, 0.95);
		backdrop-filter: blur(8px);
		padding: 0.5rem 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--node-color);
		white-space: nowrap;
		z-index: 100;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	/* Label au-dessus si le nœud est trop bas */
	.node-label.label-above {
		top: auto;
		bottom: calc(100% + 12px);
		transform: translateX(-50%) translateY(5px);
	}

	/* Alignement à gauche si trop près du bord gauche */
	.node-label.label-left {
		left: 0;
		transform: translateX(0) translateY(-5px);
	}

	.node-label.label-left.label-above {
		transform: translateX(0) translateY(5px);
	}

	/* Alignement à droite si trop près du bord droit */
	.node-label.label-right {
		left: auto;
		right: 0;
		transform: translateX(0) translateY(-5px);
	}

	.node-label.label-right.label-above {
		transform: translateX(0) translateY(5px);
	}

	.journey-node:hover .node-label,
	.journey-node.current .node-label {
		opacity: 1;
	}

	.journey-node:hover .node-label:not(.label-above),
	.journey-node.current .node-label:not(.label-above) {
		transform: translateX(-50%) translateY(0);
	}

	.journey-node:hover .node-label.label-above,
	.journey-node.current .node-label.label-above {
		transform: translateX(-50%) translateY(0);
	}

	.journey-node:hover .node-label.label-left,
	.journey-node.current .node-label.label-left {
		transform: translateX(0) translateY(0);
	}

	.journey-node:hover .node-label.label-right,
	.journey-node.current .node-label.label-right {
		transform: translateX(0) translateY(0);
	}

	.label-text {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-primary);
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.label-duration {
		display: block;
		font-size: 0.65rem;
		color: var(--node-color);
		margin-top: 2px;
	}

	/* Badge mini-jeu */
	.minigame-badge {
		position: absolute;
		top: -3px;
		left: -3px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--magic-orange);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		border: 2px solid var(--color-bg-primary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.journey-node.large .node-body {
			width: 50px;
			height: 50px;
		}

		.journey-node.medium .node-body {
			width: 42px;
			height: 42px;
		}

		.journey-node.small .node-body {
			width: 36px;
			height: 36px;
		}

		.node-label {
			display: none;
		}

		.journey-node.current .node-label {
			display: block;
		}
	}
</style>
