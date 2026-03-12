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
			<div class="screen-content">
				<header class="screen-header">
					<img src="/icons/Logos.svg" alt="Enchanted Tools" class="brand-logo" />
					<h1 class="title">Bienvenue Aventurier !</h1>
					<p class="subtitle">Choisis ton mode d'exploration</p>
				</header>

				<div class="mode-list">
					<button
						type="button"
						class="mode-card mode-card--quest"
						class:mode-card--active={selectedMode === 'quest'}
						onclick={() => selectMode('quest')}
					>
						<div class="mode-image-wrapper">
							<img
								src="/frames/Frame 81.png"
								alt="Mode Quête - Aide Miroki à rejoindre sa planète"
								class="mode-image"
							/>
						</div>
						<div class="mode-body">
							<h2>Mode Quête</h2>
							<p>Aide Miroki à rejoindre sa planète&nbsp;!</p>
						</div>
					</button>

					<button
						type="button"
						class="mode-card mode-card--tech"
						class:mode-card--active={selectedMode === 'tech'}
						onclick={() => selectMode('tech')}
					>
						<div class="mode-image-wrapper">
							<img
								src="/frames/Frame 82.png"
								alt="Mode Tech - Plonge dans les données de Miroki"
								class="mode-image"
							/>
						</div>
						<div class="mode-body">
							<h2>Mode Tech</h2>
							<p>Plonge dans les données de Miroki&nbsp;!</p>
						</div>
					</button>
				</div>

				<button
					type="button"
					class="primary-btn"
					onclick={nextStep}
					disabled={!selectedMode}
				>
					Valider mon mode
					<span class="primary-btn-arrow">➜</span>
				</button>
			</div>
		</section>
	{/if}

	<!-- ÉTAPE 2 : Infos équipe -->
	{#if step === 2}
		<section class="screen">
			<div class="screen-content screen-content--form">
				<header class="screen-header">
					<img src="/icons/Logos.svg" alt="Enchanted Tools" class="brand-logo" />
				</header>

				<div class="team-info-card">
					<div class="team-info-card__image-wrapper">
						<img
							src="/frames/Frame 83.png"
							alt="Mode quête - Qui part en mission ?"
							class="team-info-card__image"
						/>
					</div>

					<div class="team-info-card__body">
						<h1 class="team-info-card__title">Qui part en mission&nbsp;?</h1>

						<div class="field-group field-group--light">
							<label for="team-name">Nom de ton équipe</label>
							<input
								id="team-name"
								type="text"
								placeholder="Ex&nbsp;: Les Explorateurs"
								bind:value={teamName}
							/>
						</div>

						<div class="field-group field-group--light">
							<label>Nombre d'aventurier(e)s</label>

							<div class="counter-row">
								<button type="button" class="round-btn round-btn--ghost" onclick={decrement}>
									−
								</button>

								<div class="counter-value">{adventurersCount}</div>

								<button type="button" class="round-btn round-btn--primary" onclick={increment}>
									+
								</button>
							</div>
						</div>
					</div>
				</div>

				<button
					type="button"
					class="primary-btn primary-btn--full primary-btn--adventure"
					onclick={validateAndStart}
				>
					Direction l'aventure
					<span class="primary-btn-arrow">→</span>
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
		background: #050837;
		color: #fff;
		padding: 1.25rem 1.1rem;
		padding-top: calc(1.5rem + env(safe-area-inset-top));
		padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}

	.screen {
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 100%;
	}

	.screen-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
	}

	.screen-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.brand-logo {
		height: 52px;
		width: auto;
	}

	.title {
		font-size: 1.7rem;
		line-height: 1.2;
		font-weight: 800;
		margin: 0;
	}

	.subtitle {
		margin: 0;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.mode-list {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		margin-bottom: 1.5rem;
	}

	.mode-card {
		border-radius: 21px;
		border: 1px solid #e5e9ef;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		padding: 0;
		box-shadow: 0px 1px 12px rgba(0, 0, 0, 0.08);
		cursor: pointer;
		color: inherit;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease,
			background 0.15s ease;
	}

	.mode-card--quest .mode-image-wrapper,
	.mode-card--tech .mode-image-wrapper {
		border-radius: 21px 21px 0 0;
		overflow: hidden;
		background: #f7f4ed;
		max-height: 170px;
	}

	.mode-image {
		display: block;
		width: 100%;
		height: auto;
	}

	.mode-body {
		padding: 0.75rem 0.5rem 0.75rem;
		text-align: center;
		background: #ffffff;
		border-radius: 0 0 21px 21px;
	}

	.mode-body h2 {
		font-size: 1.1rem;
		margin: 0 0 0.45rem 0;
		font-weight: 700;
		color: #000b55;
	}

	.mode-body p {
		margin: 0;
		font-size: 0.92rem;
		color: #000b55;
	}

	.mode-card--active {
		border-width: 3px;
		border-color: #42a3ef;
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
		transform: translateY(-2px);
	}

	.mode-card--active .mode-body p,
	.mode-card--active .mode-body h2 {
		color: #000b55;
	}

	.screen-content--form {
		margin-top: 1rem;
	}

	.screen-content--form .screen-header {
		margin-bottom: 1rem;
	}

	.team-info-card {
		background: #ffffff;
		border-radius: 21px;
		border: 1px solid #e5e9ef;
		box-shadow: 0px 1px 12px rgba(0, 0, 0, 0.08);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.team-info-card__image-wrapper {
		position: relative;
		background: #1a2352;
		border-radius: 21px 21px 0 0;
		overflow: hidden;
		max-height: 180px;
	}

	.team-info-card__image {
		display: block;
		width: 100%;
		height: auto;
	}

	.team-info-card__mode-badge {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		color: #ffffff;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.team-info-card__mode-icon {
		font-size: 1rem;
	}

	.team-info-card__body {
		padding: 1.25rem 1.25rem 1.5rem;
	}

	.team-info-card__title {
		font-size: 1.5rem;
		font-weight: 800;
		color: #1d1938;
		margin: 0 0 1rem 0;
		line-height: 1.2;
	}

	.field-group--light label {
		color: #1d1938;
	}

	.field-group--light input {
		background: #f5f5f5;
		color: #1d1938;
		border: 1px solid #e0e0e0;
	}

	.round-btn {
		width: 48px;
		height: 48px;
		border-radius: 999px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.15s ease;
	}

	.round-btn--ghost {
		background: rgba(255, 255, 255, 0.25);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.4);
	}

	.round-btn--ghost:hover {
		background: rgba(255, 255, 255, 0.35);
	}

	.round-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		font-size: 1.5rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.15s ease;
	}

	.round-btn--ghost {
		background: rgba(26, 35, 82, 0.15);
		color: #1d1938;
		border: 1px solid rgba(26, 35, 82, 0.25);
	}

	.round-btn--ghost:hover {
		background: rgba(26, 35, 82, 0.25);
	}

	.round-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		font-size: 1.5rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.15s ease;
	}

	.round-btn--ghost {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.round-btn--ghost:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.field-group--light .round-btn--ghost {
		background: #e8e8e8;
		color: #1d1938;
		border: 1px solid #d0d0d0;
	}

	.field-group--light .round-btn--ghost:hover {
		background: #ddd;
	}

	.field-group--light .counter-value {
		color: #1d1938;
	}

	.round-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	.round-btn--ghost {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.round-btn--ghost:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.round-btn {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		font-size: 1.5rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
		border: 2px solid transparent;
	}

	.round-btn--ghost {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.round-btn--ghost:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.round-btn--primary {
		background: #1a2352;
		color: #ffffff;
		border: none;
		box-shadow: 0 2px 8px rgba(26, 35, 82, 0.3);
	}

	.team-info-card .round-btn--ghost {
		background: rgba(0, 0, 0, 0.06);
		color: #1d1938;
		border-color: #e0e0e0;
	}

	.team-info-card .round-btn--ghost:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	.team-info-card .counter-value {
		color: #1d1938;
	}

	.round-btn--primary:hover {
		background: #252d5c;
	}

	.round-btn--primary:hover {
		background: #252d5c;
	}

	.round-btn--primary:hover {
		background: #252d5c;
	}

	.primary-btn--adventure {
		background: #1a2352;
		color: #ffffff;
		width: 100%;
		max-width: 320px;
		box-shadow: 0 14px 32px rgba(26, 35, 82, 0.4);
	}

	.primary-btn--adventure:hover {
		background: #252d5c;
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

	.primary-btn {
		margin-top: 0.5rem;
		width: 221px;
		align-self: center;
		border-radius: 12px;
		padding: 0.9rem 1.4rem;
		border: none;
		font-size: 1rem;
		font-weight: 700;
		background: rgba(0, 0, 0, 0.25);
		color: #ffffff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55);
	}

	.primary-btn:disabled {
		opacity: 0.4;
		cursor: default;
		box-shadow: none;
	}

	.primary-btn:active {
		color: #848484;
		box-shadow:
			0 0 0 0 rgba(66, 163, 239, 0.0),
			0 0 25px 12px rgba(66, 163, 239, 0.48);
	}

	.primary-btn-arrow {
		font-size: 1.1rem;
	}

	@media (min-width: 768px) {
		.onboarding-page {
			align-items: center;
			justify-content: center;
		}
	}
</style>

