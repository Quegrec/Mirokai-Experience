<script lang="ts">
	import JourneyMap from '$lib/components/JourneyMap.svelte';
	import { Sparkles, Trophy, Clock, Gamepad2, ChevronRight, X, Menu } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { ModuleRow, MiniGameRow, JourneyNode, AppSettings, ModuleContent } from '$lib/supabase/types';

	let { data } = $props();

let modules = $state<ModuleRow[]>([]);
let miniGames = $state<MiniGameRow[]>([]);
let settings = $state<AppSettings | null>(null);
let isLoading = $state(true);
let teamName = $state<string | null>(null);
let userScore = $state(0);

// Progression (stockée en sessionStorage - persiste pendant la session uniquement)
let completedNodeIds = $state<string[]>([]);
let currentNodeId = $state<string | null>(null);

	// Modal pour afficher les détails d'un nœud
	let selectedNode = $state<JourneyNode | null>(null);
	// Étape interne de la modale pour les modules (intro / audio / quiz)
	let nodeModalStep = $state<'intro' | 'audio' | 'quiz'>('intro');

	// Menu stats ouvert/fermé sur mobile
	let showStats = $state(false);

	// URL de fond du parcours
	const backgroundUrl = $derived(settings?.journey_background_url || null);

	// Mini-jeu quiz associé au module sélectionné (s'il existe)
	const attachedQuiz = $derived(
		selectedNode && selectedNode.type === 'module' && selectedNode.data
			? miniGames.find(
					(game) =>
						game.after_module_id === (selectedNode!.data as ModuleRow).id &&
						game.status === 'actif'
			  ) ?? null
			: null
	);

	// État du quiz dans la modale
	let quizQuestionIndex = $state(0);
	let selectedAnswerIndex = $state<number | null>(null);
	let showQuizCorrection = $state(false);

	const totalQuizQuestions = $derived(
		attachedQuiz?.contenu?.questions ? attachedQuiz.contenu.questions.length : 0
	);
	const currentQuizQuestion = $derived(
		totalQuizQuestions > 0 && attachedQuiz?.contenu?.questions
			? attachedQuiz.contenu.questions[quizQuestionIndex]
			: null
	);

	const isLastQuizQuestion = $derived(
		attachedQuiz?.contenu?.questions
			? quizQuestionIndex === attachedQuiz.contenu.questions.length - 1
			: false
	);

	// Statistiques calculées (les mini-jeux ne sont plus comptés comme étapes du parcours)
	const totalDuration = $derived(
		modules
			.filter(m => m.status === 'actif')
			.reduce((acc, m) => acc + m.duree_estimee, 0)
	);

	const activeModulesCount = $derived(modules.filter(m => m.status === 'actif').length);
	const activeMiniGamesCount = $derived(miniGames.filter(g => g.status === 'actif').length);

	// On ne compte que les modules comme nœuds du parcours
	const completedModuleIds = $derived(
		completedNodeIds.filter((id) => modules.some((m) => m.id === id))
	);
	const totalNodes = $derived(activeModulesCount);
	const progressPercent = $derived(
		totalNodes > 0 ? Math.round((completedModuleIds.length / totalNodes) * 100) : 0
	);

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
					userScore = progress.score ?? 0;
				} catch (e) {
					console.error('Error loading progress:', e);
				}
			}

			// Charger les infos d'onboarding pour récupérer le nom de l'équipe
			const savedOnboarding = sessionStorage.getItem('mirokai-onboarding');
			if (savedOnboarding) {
				try {
					const onboarding = JSON.parse(savedOnboarding);
					teamName = onboarding.teamName || null;
				} catch (e) {
					console.error('Error loading onboarding:', e);
				}
			}
		}

		isLoading = false;
	});

	function handleNodeClick(node: JourneyNode) {
		selectedNode = node;
		// Toujours revenir à la première "page" quand on ouvre la modale
		if (node.type === 'module') {
			nodeModalStep = 'intro';
			quizQuestionIndex = 0;
			selectedAnswerIndex = null;
			showQuizCorrection = false;
		}
	}

	function closeModal() {
		selectedNode = null;
		selectedAnswerIndex = null;
		showQuizCorrection = false;
	}

	function goToAudioStep() {
		if (selectedNode?.type === 'module') {
			nodeModalStep = 'audio';
		}
	}

	function backToIntroStep() {
		if (selectedNode?.type === 'module') {
			nodeModalStep = 'intro';
		}
	}

	function goToQuizStep() {
		if (selectedNode?.type === 'module' && attachedQuiz && totalQuizQuestions > 0) {
			// Marquer ce module comme en cours pour que completeCurrentNode fonctionne
			currentNodeId = selectedNode.id;
			saveProgress();

			nodeModalStep = 'quiz';
			quizQuestionIndex = 0;
			selectedAnswerIndex = null;
			showQuizCorrection = false;
		}
	}

	function handleAnswerSelect(index: number) {
		if (showQuizCorrection) return;
		selectedAnswerIndex = index;
	}

	function handleQuizValidate() {
		if (!attachedQuiz || !attachedQuiz.contenu?.questions) return;
		if (!currentQuizQuestion || selectedAnswerIndex === null) return;

		// Première validation : on affiche la bonne réponse
		if (!showQuizCorrection) {
			// Incrémenter le score si la réponse est correcte
			if (selectedAnswerIndex === currentQuizQuestion.correctIndex) {
				userScore = userScore + 1;
				saveProgress();
			}

			showQuizCorrection = true;
			return;
		}

		// Deuxième clic : on passe à la question suivante ou on termine la mission
		if (!isLastQuizQuestion) {
			quizQuestionIndex = quizQuestionIndex + 1;
			selectedAnswerIndex = null;
			showQuizCorrection = false;
		} else {
			// Dernière question : on marque le module comme terminé et on revient à la carte
			completeCurrentNode();
		}
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
			current: currentNodeId,
			score: userScore
		}));
	}

	function resetProgress() {
		completedNodeIds = [];
		currentNodeId = null;
		userScore = 0;
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
	<!-- SECTION 1: Header (devient le bouton pour ouvrir les stats) -->
	<header 
		class="journey-header"
		role="button"
		tabindex="0"
		onclick={() => showStats = !showStats}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				showStats = !showStats;
			}
		}}
	>
		<div class="header-left">
			<div class="logo-icon">
				<Sparkles size={20} />
			</div>
			<div class="header-title">
				<h1>Mirokaï</h1>
				<span class="progress-badge">{progressPercent}%</span>
				{#if teamName}
					<span class="team-badge">{teamName}</span>
				{/if}
			</div>
		</div>

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
						<Trophy size={16} class="text-(--magic-turquoise)" />
						<span class="stat-value">{activeModulesCount}</span>
						<span class="stat-label">Modules</span>
					</div>
					<div class="stat-item">
						<Gamepad2 size={16} class="text-(--magic-magenta)" />
						<span class="stat-value">{userScore}</span>
						<span class="stat-label">Score</span>
					</div>
					<div class="stat-item">
						<Clock size={16} class="text-(--magic-orange)" />
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
	<div class="modal-overlay" onclick={closeModal} role="dialog" aria-modal="true" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && closeModal()}>
		<div class="modal-content glass" role="document" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeModal} aria-label="Fermer">
				<X size={20} />
			</button>

			{#if selectedNode.data}
				{@const nodeData = selectedNode.data}
				{@const moduleContent = ('contenu' in nodeData ? (nodeData as ModuleRow).contenu : null) as ModuleContent | null}

				{#if selectedNode.type === 'module'}
					<!-- Flow spécifique pour les modules : écran 1 (intro) puis écran 2 (audio) -->
					<div class="module-flow">
						<div class="module-flow-header">
							<div class="mission-chip">
								<span>Mission {nodeData.ordre?.toString().padStart(2, '0') || '01'}</span>
								<span class="mission-rocket"><img src="/icons/rocket.svg" alt="Rocket" width="16" height="16"></span>
							</div>
							<div class="mission-progress-bar">
								<div class="mission-progress-fill {nodeModalStep === 'audio' ? 'is-after' : ''}"></div>
							</div>
						</div>

						{#if nodeModalStep === 'intro'}
							<section class="module-screen module-screen-intro">
								<div class="module-hero">
									<!-- Illustration principale (sans fond nuageux global) -->
									<div class="module-hero-image"></div>
								</div>

								<div class="module-content-block">
									<h2 class="module-title">{nodeData.nom}</h2>

									<div class="module-meta-row">
										<div class="meta-pill">
											<Clock size={14} />
											<span>{nodeData.duree_estimee} min</span>
										</div>
									</div>

									<p class="module-description">
										{nodeData.description}
									</p>
								</div>

								<div class="module-footer-actions">
									<button class="btn-primary large" onclick={goToAudioStep}>
										Continuer
										<ChevronRight size={18} />
									</button>
								</div>
							</section>
						{:else if nodeModalStep === 'audio'}
							<section class="module-screen module-screen-audio">
								<div class="module-flow-header-secondary">
									<button class="back-link" onclick={backToIntroStep}>
										← Revenir à la mission
									</button>
								</div>

								<div class="module-content-block">
									<h2 class="module-title">
										Rapproche ton oreille et écoute l'histoire de Miroki…
									</h2>

									{#if moduleContent?.mediaUrl}
										<div class="module-audio-player">
											<audio
												controls
												src={moduleContent.mediaUrl}
												class="audio-player"
											></audio>
										</div>
									{:else}
										<p class="module-description">
											(Aucun audio n'est configuré pour ce module pour le moment.)
										</p>
									{/if}
								</div>

								<div class="module-footer-actions">
									{#if selectedNode.status === 'completed'}
										<button class="btn-secondary" onclick={closeModal}>
											Déjà complété ✓
										</button>
									{:else if selectedNode.status === 'current'}
										<button class="btn-primary" onclick={completeCurrentNode}>
											Marquer comme terminé
										</button>
									{:else if selectedNode.status === 'available'}
										{#if attachedQuiz && totalQuizQuestions > 0}
											<button class="btn-primary" onclick={goToQuizStep}>
												Passer au quizz 
												<ChevronRight size={18} />
											</button>
										{:else}
											<button class="btn-primary" onclick={() => startNode(selectedNode!)}>
												Démarrer la mission
												<ChevronRight size={18} />
											</button>
										{/if}
									{:else}
										<button class="btn-locked" disabled>
											🔒 Terminez l'étape précédente
										</button>
									{/if}
								</div>
							</section>
						{:else if nodeModalStep === 'quiz'}
							<!-- Écran Quiz avec les questions du mini-jeu associé -->
							<section class="module-screen module-screen-quiz">
								<div class="quiz-header">
									<div class="quiz-mission">
										<span class="quiz-mission-label">
											Mission {nodeData.ordre?.toString().padStart(2, '0') || '01'}
										</span>
									</div>
									{#if totalQuizQuestions > 0}
										<span class="quiz-question-count">
											Question {quizQuestionIndex + 1}/{totalQuizQuestions}
										</span>
									{/if}
								</div>

								<div class="quiz-hero-circle">
									<div class="quiz-hero-image"></div>
								</div>

								{#if currentQuizQuestion}
									<div class="quiz-question-block">
										<h2 class="quiz-question-title">
											{currentQuizQuestion.question}
										</h2>
										<p class="quiz-subtitle">
											Choisis une réponse
										</p>
									</div>

									<div class="quiz-options-grid">
										{#each currentQuizQuestion.options as option, idx}
											<button
												type="button"
												class="quiz-option-card"
												class:is-selected={selectedAnswerIndex === idx}
												class:is-correct={showQuizCorrection && idx === currentQuizQuestion.correctIndex}
												class:is-wrong={showQuizCorrection && selectedAnswerIndex !== null && idx === selectedAnswerIndex && idx !== currentQuizQuestion.correctIndex}
												disabled={showQuizCorrection}
												onclick={() => handleAnswerSelect(idx)}
											>
												<span>{option}</span>
											</button>
										{/each}
									</div>
								{:else}
									<p class="quiz-empty">
										Aucune question configurée pour ce quizz pour le moment.
									</p>
								{/if}

								<div class="quiz-footer-actions">
									<button
										type="button"
										class="quiz-validate-btn"
										onclick={handleQuizValidate}
										disabled={!currentQuizQuestion || selectedAnswerIndex === null}
									>
										{#if !showQuizCorrection}
											Valider ma réponse
										{:else if !isLastQuizQuestion}
											Question suivante
										{:else}
											Terminer la mission
										{/if}
										<ChevronRight size={18} />
									</button>
								</div>
							</section>
						{/if}
					</div>
				{:else}
					<!-- Fallback : layout existant pour les mini-jeux et autres types -->
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

						{#if moduleContent}
							{#if moduleContent.mediaUrl}
								<div class="modal-audio">
									<h4>Guide audio</h4>
									<audio
										controls
										src={moduleContent.mediaUrl}
										class="audio-player"
									></audio>
								</div>
							{/if}

							{#if moduleContent.instructions}
								<div class="modal-instructions">
									<h4>Ce que vous allez faire :</h4>
									<ul>
										{#each moduleContent.instructions as instruction}
											<li>{instruction}</li>
										{/each}
									</ul>
								</div>
							{/if}
						{/if}

						{#if selectedNode.type === 'minigame' && 'recompense' in nodeData && nodeData.recompense}
							<div class="modal-reward">
								<Trophy size={16} class="text-(--magic-orange)" />
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
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ========================================
	   LAYOUT 3 SECTIONS: Header / Map / Footer
	   (styles spécifiques à la page Journey)
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
		position: fixed;
		top: 0.75rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0.75rem;
		padding-top: calc(0.5rem + env(safe-area-inset-top));
		background: rgba(15, 23, 42, 0.9);
		border-radius: 999px;
		border: 1px solid var(--color-border);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(12px);
		max-width: min(540px, 100% - 2rem);
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

.team-badge {
	padding: 0.2rem 0.6rem;
	border-radius: 1rem;
	background: rgba(255, 255, 255, 0.08);
	color: var(--color-text-muted);
	font-size: 0.7rem;
	font-weight: 500;
	max-width: 140px;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
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
		position: fixed;
		top: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 95;
		padding: 1rem;
		margin: 0;
		border-radius: 1rem;
		animation: slideDown 0.2s ease;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		max-width: min(540px, 100% - 2rem);
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
	   MODAL - réglages spécifiques à cette page
	   (styles de base définis dans app.css)
	   ======================================== */

	.modal-audio {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: rgba(15, 23, 42, 0.7);
		border: 1px solid var(--color-border);
	}

	.modal-audio h4 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.audio-player {
		width: 100%;
	}

	/* ========================================
	   FLOW MODULE - écrans plein format intro + audio
	   ======================================== */

	.module-flow {
		display: flex;
		flex-direction: column;
		gap: 0;
		min-height: 100%;
	}

	.module-flow-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.mission-chip {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.8rem;
		border-radius: 999px;
		background: rgba(129, 140, 248, 0.25);
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.mission-rocket {
		font-size: 0.9rem;
	}

	.mission-progress-bar {
		position: relative;
		width: 100%;
		height: 4px;
		border-radius: 999px;
		background: rgba(148, 163, 184, 0.4);
		overflow: hidden;
	}

	.mission-progress-fill {
		position: absolute;
		inset: 0;
		width: 45%;
		background: linear-gradient(90deg, var(--magic-turquoise), var(--magic-magenta));
		border-radius: inherit;
		transition: transform 0.3s ease;
		transform-origin: left;
	}

	.mission-progress-fill.is-after {
		transform: translateX(120%);
	}

	.module-screen {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.module-hero {
		border-radius: 1.25rem;
		overflow: hidden;
		background: radial-gradient(circle at 20% 10%, rgba(250, 250, 255, 0.18), transparent 55%),
			radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.3), transparent 60%),
			radial-gradient(circle at 10% 80%, rgba(59, 130, 246, 0.35), transparent 60%),
			linear-gradient(145deg, #020617, #0f172a 55%, #1e293b 100%);
		min-height: 160px;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		margin-bottom: 1.25rem;
	}

	.module-hero-image {
		flex: 1;
		background-image: url('/frames/Frame 81.png');
		background-size: cover;
		background-position: center;
	}
	.module-content-block {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.module-title {
		font-size: 1.2rem;
		font-weight: 800;
		color: var(--color-text-primary);
		margin: 0;
	}

	.module-subtitle {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.module-meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.meta-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.85);
		border: 1px solid rgba(148, 163, 184, 0.35);
		font-size: 0.75rem;
		color: var(--color-text-primary);
	}

	.module-description {
		font-size: 0.9rem;
		line-height: 1.4;
		color: var(--color-text-primary);
		margin: 0;
	}

	.module-footer-actions {
		margin-top: auto;
		display: flex;
		justify-content: center;
	}

	.btn-primary.large {
		width: 100%;
		padding: 0.85rem 1.2rem;
		font-size: 0.95rem;
		font-weight: 700;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.module-flow-header-secondary {
		margin-bottom: 0.75rem;
	}

	.back-link {
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
	}

	.module-audio-player {
		margin-top: 1rem;
		padding: 0.75rem 0.9rem;
		border-radius: 1rem;
		background: rgba(15, 23, 42, 0.8);
		border: 1px solid rgba(148, 163, 184, 0.4);
	}

	/* ========================================
	   QUIZ SCREEN - style proche de la maquette
	   ======================================== */

	.module-screen-quiz {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quiz-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8rem;
		color: #e5e7eb;
		margin-bottom: 0.25rem;
	}

	.quiz-mission-label {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		background: rgba(129, 140, 248, 0.3);
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.quiz-question-count {
		font-weight: 500;
		color: rgba(249, 250, 251, 0.85);
	}

	.quiz-hero-circle {
		margin: 0.25rem auto 0.75rem auto;
		width: 140px;
		height: 140px;
		border-radius: 999px;
		border: 3px solid rgba(244, 244, 245, 0.7);
		box-shadow: 0 0 20px rgba(56, 189, 248, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: radial-gradient(circle at 20% 0%, rgba(250, 250, 255, 0.18), transparent 55%),
			radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.3), transparent 60%),
			linear-gradient(145deg, #020617, #0f172a 55%, #1e293b 100%);
	}

	.quiz-hero-image {
		width: 100%;
		height: 100%;
		background-image: url('/frames/Frame 81.png');
		background-size: cover;
		background-position: center;
	}

	.quiz-question-block {
		text-align: left;
		margin-bottom: 0.75rem;
	}

	.quiz-question-title {
		font-size: 1.1rem;
		font-weight: 800;
		color: #f9fafb;
		margin: 0 0 0.35rem 0;
	}

	.quiz-subtitle {
		font-size: 0.85rem;
		color: #e5e7eb;
		margin: 0;
	}

	.quiz-options-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.quiz-option-card {
		border: none;
		cursor: pointer;
		border-radius: 1.1rem;
		padding: 0.9rem 0.75rem;
		background: rgba(15, 23, 42, 0.9);
		color: #f9fafb;
		font-weight: 600;
		font-size: 0.85rem;
		box-shadow: 0 8px 18px rgba(15, 23, 42, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.6);
		text-align: center;
		transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease,
			background 0.12s ease;
	}

	.quiz-option-card span {
		display: block;
	}

	.quiz-option-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 20px rgba(15, 23, 42, 1);
		border-color: rgba(56, 189, 248, 0.8);
	}

	.quiz-option-card.is-selected {
		background: linear-gradient(135deg, #f97316, #fb923c);
		color: #111827;
		border-color: transparent;
		box-shadow: 0 12px 24px rgba(248, 113, 113, 0.4);
	}

	.quiz-option-card.is-correct {
		background: linear-gradient(135deg, #22c55e, #4ade80);
		color: #052e16;
		border-color: rgba(34, 197, 94, 0.8);
		box-shadow: 0 12px 24px rgba(34, 197, 94, 0.5);
	}

	.quiz-option-card.is-wrong {
		background: linear-gradient(135deg, #ef4444, #f97373);
		color: #7f1d1d;
		border-color: rgba(239, 68, 68, 0.8);
		box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
	}

	.quiz-empty {
		font-size: 0.9rem;
		color: #e5e7eb;
		text-align: center;
		margin: 1rem 0;
	}

	.quiz-footer-actions {
		margin-top: auto;
	}

	.quiz-validate-btn {
		width: 100%;
		border-radius: 999px;
		padding: 0.9rem 1.2rem;
		background: linear-gradient(135deg, #f97316, #fb923c);
		color: #111827;
		border: none;
		font-weight: 700;
		font-size: 0.9rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		cursor: pointer;
		box-shadow: 0 10px 24px rgba(248, 113, 113, 0.45);
	}

	.quiz-validate-btn:disabled {
		opacity: 0.5;
		cursor: default;
		box-shadow: none;
	}

	/* ========================================
	   DESKTOP - Media queries
	   ======================================== */
	
	@media (min-width: 768px) {
		.journey-header {
			top: 1.25rem;
		}

		.logo-icon {
			width: 44px;
			height: 44px;
		}

		.header-title h1 {
			font-size: 1.5rem;
		}

		.stats-panel {
			top: 4.75rem;
			left: 50%;
			transform: translateX(-50%);
			min-width: 320px;
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

