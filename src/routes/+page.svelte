<script lang="ts">
	import { goto } from '$app/navigation';

	// Étape du mini-onboarding (1 = choix du mode, 2 = équipe)
	let step = $state(1);

	// Données du formulaire
	type Mode = 'quest' | 'tech';
	let selectedMode = $state<Mode | null>('quest');
	let teamName = $state('');
	let adventurersCount = $state(1);

	const MIN_ADVENTURERS = 1;
	const MAX_ADVENTURERS = 6;

	function selectMode(mode: Mode) {
		selectedMode = mode;
	}

	function nextStep() {
		if (!selectedMode) return;
		step = 2;
	}

	function increment() {
		if (adventurersCount < MAX_ADVENTURERS) {
			adventurersCount += 1;
		}
	}

	function decrement() {
		if (adventurersCount > MIN_ADVENTURERS) {
			adventurersCount -= 1;
		}
	}

	function validateAndStart() {
		// On sauvegarde simplement les infos dans sessionStorage pour la session en cours
		if (typeof window !== 'undefined') {
			const payload = {
				mode: selectedMode,
				teamName: teamName.trim() || null,
				adventurersCount
			};
			sessionStorage.setItem('mirokai-onboarding', JSON.stringify(payload));
		}

		// Redirection vers la carte
		goto('/journey');
	}
</script>

<svelte:head>
	<title>Mirokaï Experience — Bienvenue</title>
	<meta name="description" content="Choisis ton mode d'exploration et prépare ton équipe avant de partir en mission." />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class="onboarding-page">
	<!-- ÉTAPE 1 : Choix du mode -->
	{#if step === 1}
		<section class="screen">
			<div class="screen-illustration">
				<!-- Placeholder : tu pourras remplacer par ton illustration 3D -->
				<div class="robots-placeholder">
					<div class="robot robot-left"></div>
					<div class="robot robot-right"></div>
				</div>
			</div>

			<div class="screen-content">
				<h1 class="title">Ta mission commence<br />ici</h1>
				<p class="subtitle">Choisis ton mode d'exploration</p>

				<div class="modes-grid">
					<button
						type="button"
						class="mode-card quest"
						class:mode-card--active={selectedMode === 'quest'}
						onclick={() => selectMode('quest')}
					>
						<div class="mode-icon map-icon">🗺️</div>
						<div class="mode-text">
							<h2>Mode Quête</h2>
							<p>Pars en mission avec Miroki</p>
						</div>
					</button>

					<button
						type="button"
						class="mode-card tech"
						class:mode-card--active={selectedMode === 'tech'}
						onclick={() => selectMode('tech')}
					>
						<div class="mode-icon robot-icon">🤖</div>
						<div class="mode-text">
							<h2>Mode Tech</h2>
							<p>Plonge dans les données du robot</p>
						</div>
					</button>
				</div>

				<button
					type="button"
					class="primary-btn"
					onclick={nextStep}
					disabled={!selectedMode}
				>
					Valider mon mode →
				</button>
			</div>
		</section>
	{/if}

	<!-- ÉTAPE 2 : Infos équipe -->
	{#if step === 2}
		<section class="screen">
			<div class="screen-content screen-content--form">
				<p class="step-label">Étape 1/4</p>
				<h1 class="title">Qui part en mission&nbsp;?</h1>

				<div class="field-group">
					<label for="team-name">Nom de ton équipe</label>
					<input
						id="team-name"
						type="text"
						placeholder="Ex&nbsp;: Les Explorateurs"
						bind:value={teamName}
					/>
				</div>

				<div class="field-group">
					<label>Nombre d'aventurier·ères</label>

					<div class="counter-row">
						<button type="button" class="round-btn round-btn--ghost" onclick={decrement}>
							−
						</button>

						<div class="counter-value">{adventurersCount}</div>

						<button type="button" class="round-btn" onclick={increment}>
							+
						</button>
					</div>

					<div class="dots-row" aria-hidden="true">
						{#each Array(MAX_ADVENTURERS) as _, index}
							<div
								class="dot"
								class:dot--active={index < adventurersCount}
							>
								{index === 0 ? 1 : ''}
							</div>
						{/each}
					</div>
				</div>

				<button
					type="button"
					class="primary-btn primary-btn--full"
					onclick={validateAndStart}
				>
					On y va ! 🚀
				</button>
			</div>
		</section>
	{/if}
</div>

<style>
	.onboarding-page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: radial-gradient(circle at top, #1d2e7a 0%, #050837 45%, #020320 100%);
		color: #fff;
		padding: 1.5rem 1.25rem;
		padding-top: calc(1.5rem + env(safe-area-inset-top));
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.screen {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		height: 100%;
	}

	.screen-illustration {
		display: flex;
		justify-content: center;
		padding-top: 1rem;
	}

	.robots-placeholder {
		width: 220px;
		height: 130px;
		border-radius: 110px;
		background: radial-gradient(circle at top, #f2f2f7 0%, #b3a7ff 50%, #6b5ad5 100%);
		display: flex;
		align-items: flex-end;
		justify-content: space-evenly;
		padding-bottom: 1.25rem;
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
	}

	.robot {
		width: 52px;
		height: 80px;
		border-radius: 26px;
		background: linear-gradient(180deg, #ffd57a, #e59129);
		position: relative;
	}

	.robot-right {
		background: linear-gradient(180deg, #ffb38f, #e86b2a);
	}

	.title {
		font-size: 1.9rem;
		line-height: 1.2;
		font-weight: 800;
		margin: 0 0 0.75rem 0;
		text-align: center;
	}

	.subtitle {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.modes-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	.mode-card {
		border-radius: 1.2rem;
		padding: 1.1rem 0.9rem;
		border: 2px solid transparent;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
		cursor: pointer;
		color: inherit;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease,
			background 0.15s ease;
	}

	.mode-card--active {
		border-color: #f4b53a;
		background: linear-gradient(160deg, #7859ff, #a851ff);
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.55);
	}

	.mode-card h2 {
		font-size: 1rem;
		margin: 0;
		font-weight: 700;
	}

	.mode-card p {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.9;
	}

	.mode-icon {
		width: 32px;
		height: 32px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.14);
	}

	.screen-content {
		display: flex;
		flex-direction: column;
	}

	.screen-content--form {
		margin-top: 1rem;
	}

	.step-label {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 0.5rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 1.5rem;
	}

	.field-group label {
		font-size: 0.9rem;
		font-weight: 600;
	}

	input[type='text'] {
		background: rgba(255, 255, 255, 0.96);
		color: #1d1938;
		border-radius: 0.9rem;
		border: none;
		padding: 0.9rem 1rem;
		font-size: 0.95rem;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
	}

	input::placeholder {
		color: rgba(18, 15, 40, 0.55);
	}

	.counter-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1rem;
	}

	.counter-value {
		font-size: 2.3rem;
		font-weight: 700;
	}

	.dots-row {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.dot {
		width: 24px;
		height: 24px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		color: #1b163f;
	}

	.dot--active {
		background: #f4b53a;
	}

	@media (min-width: 768px) {
		.onboarding-page {
			align-items: center;
			justify-content: center;
		}
	}
</style>

