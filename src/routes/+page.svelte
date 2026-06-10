<script lang="ts">
	import { goto } from '$app/navigation';

	let step = $state(1);

	type Mode = 'famille' | 'tech';
	let selectedMode = $state<Mode | null>(null);
	let teamName = $state('');
	let adventurersCount = $state(1);

	const MIN_ADVENTURERS = 1;
	const MAX_ADVENTURERS = 6;

	function nextStep() {
		if (!selectedMode) return;
		step = 2;
	}

	function increment() {
		if (adventurersCount < MAX_ADVENTURERS) adventurersCount += 1;
	}

	function decrement() {
		if (adventurersCount > MIN_ADVENTURERS) adventurersCount -= 1;
	}

	function validateAndStart() {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('mirokai-onboarding', JSON.stringify({
				mode: selectedMode,
				teamName: teamName.trim() || null,
				adventurersCount
			}));
			sessionStorage.removeItem('mirokai-video-seen');
		}
		goto('/journey');
	}
</script>

<svelte:head>
	<title>Mirokaï Experience — Bienvenue</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class="page">
	<!-- ── ÉTAPE 1 : choix du mode ── -->
	{#if step === 1}
		<section class="screen">
			<header class="brand">
				<img src="/icons/Logos.svg" alt="Enchanted Tools" class="logo" />
			</header>

			<div class="hero">
				<h1 class="hero-title">Bienvenue<br/>Aventurier&nbsp;!</h1>
				<p class="hero-sub">Choisis ton mode d'exploration</p>
			</div>

			<div class="mode-grid">
				<!-- Mode Famille -->
				<button
					class="mode-card"
					class:is-selected={selectedMode === 'famille'}
					onclick={() => (selectedMode = 'famille')}
					type="button"
				>
					<div class="mode-img-wrap">
						<img src="/frames/Frame 81.png" alt="Mode Famille" class="mode-img" />
						{#if selectedMode === 'famille'}
							<div class="mode-check">✓</div>
						{/if}
					</div>
					<div class="mode-label">
						<span class="mode-icon">🧩</span>
						<div>
							<p class="mode-name">Mode Famille</p>
							<p class="mode-desc">Aide Miroki à rejoindre sa planète&nbsp;!</p>
						</div>
					</div>
				</button>

				<!-- Mode Tech -->
				<button
					class="mode-card"
					class:is-selected={selectedMode === 'tech'}
					onclick={() => (selectedMode = 'tech')}
					type="button"
				>
					<div class="mode-img-wrap">
						<img src="/frames/Frame 82.png" alt="Mode Tech" class="mode-img" />
						{#if selectedMode === 'tech'}
							<div class="mode-check">✓</div>
						{/if}
					</div>
					<div class="mode-label">
						<span class="mode-icon">🔬</span>
						<div>
							<p class="mode-name">Mode Tech</p>
							<p class="mode-desc">Plonge dans les données de Miroki&nbsp;!</p>
						</div>
					</div>
				</button>
			</div>

			<button
				class="cta-btn"
				class:cta-btn--ready={!!selectedMode}
				onclick={nextStep}
				disabled={!selectedMode}
				type="button"
			>
				{selectedMode ? 'Continuer' : 'Choisis un mode'}
				<span class="cta-arrow">→</span>
			</button>
		</section>
	{/if}

	<!-- ── ÉTAPE 2 : infos équipe ── -->
	{#if step === 2}
		<section class="screen">
			<header class="brand">
				<img src="/icons/Logos.svg" alt="Enchanted Tools" class="logo" />
			</header>

			<div class="card">
				<div class="card-img-wrap">
					<img src="/frames/Frame 83.png" alt="Équipe" class="card-img" />
					<div class="card-mode-badge">
						{selectedMode === 'tech' ? '🔬 Mode Tech' : '🧩 Mode Famille'}
					</div>
				</div>

				<div class="card-body">
					<h2 class="card-title">Qui part en mission&nbsp;?</h2>

					<div class="field">
						<label for="team-name" class="field-label">Nom de ton équipe</label>
						<input
							id="team-name"
							type="text"
							placeholder="Ex : Les Explorateurs"
							bind:value={teamName}
							class="field-input"
						/>
					</div>

					<div class="field">
						<label class="field-label">Nombre d'aventurier·e·s</label>
						<div class="counter">
							<button class="counter-btn counter-btn--minus" type="button" onclick={decrement}>−</button>
							<span class="counter-val">{adventurersCount}</span>
							<button class="counter-btn counter-btn--plus" type="button" onclick={increment}>+</button>
						</div>
					</div>
				</div>
			</div>

			<button class="cta-btn cta-btn--ready cta-btn--adventure" onclick={validateAndStart} type="button">
				🚀&nbsp; Partir à l'aventure
			</button>

			<button class="back-link" onclick={() => (step = 1)} type="button">
				← Changer de mode
			</button>
		</section>
	{/if}
</div>

<style>
	/* ── Base ── */
	.page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: radial-gradient(ellipse at 20% 0%, rgba(14,170,162,.25) 0%, transparent 55%),
		            radial-gradient(ellipse at 80% 100%, rgba(163,51,124,.2) 0%, transparent 55%),
		            #050837;
		padding: calc(1.5rem + env(safe-area-inset-top)) 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
		color: #fff;
	}

	.screen {
		width: 100%;
		max-width: 440px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		animation: fadeUp .35s ease both;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(16px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ── Brand ── */
	.brand { display: flex; justify-content: center; }
	.logo  { height: 48px; width: auto; }

	/* ── Hero ── */
	.hero { text-align: center; }

	.hero-title {
		font-size: clamp(2rem, 8vw, 2.6rem);
		font-weight: 900;
		line-height: 1.15;
		margin: 0 0 .4rem;
		background: linear-gradient(135deg, #fff 30%, rgba(14,170,162,.9));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-sub {
		margin: 0;
		font-size: 1rem;
		color: rgba(255,255,255,.65);
	}

	/* ── Mode cards ── */
	.mode-grid {
		display: flex;
		flex-direction: column;
		gap: .85rem;
	}

	.mode-card {
		background: rgba(255,255,255,.04);
		border: 1.5px solid rgba(255,255,255,.12);
		border-radius: 1.25rem;
		overflow: hidden;
		cursor: pointer;
		text-align: left;
		transition: border-color .2s, transform .15s, box-shadow .2s;
		padding: 0;
		color: inherit;
	}

	.mode-card:hover {
		border-color: rgba(14,170,162,.5);
		transform: translateY(-2px);
	}

	.mode-card.is-selected {
		border-color: #0EAAA2;
		box-shadow: 0 0 0 3px rgba(14,170,162,.2), 0 12px 32px rgba(0,0,0,.4);
		transform: translateY(-2px);
	}

	.mode-img-wrap {
		position: relative;
		background: rgba(255,255,255,.06);
		max-height: 130px;
		overflow: hidden;
	}

	.mode-img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
	}

	.mode-check {
		position: absolute;
		top: .6rem;
		right: .6rem;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: #0EAAA2;
		color: #fff;
		font-size: .85rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(14,170,162,.5);
	}

	.mode-label {
		display: flex;
		align-items: center;
		gap: .75rem;
		padding: .7rem 1rem;
	}

	.mode-icon { font-size: 1.4rem; flex-shrink: 0; }

	.mode-name {
		margin: 0 0 .15rem;
		font-size: .95rem;
		font-weight: 700;
		color: #fff;
	}

	.mode-desc {
		margin: 0;
		font-size: .8rem;
		color: rgba(255,255,255,.55);
	}

	/* ── CTA ── */
	.cta-btn {
		align-self: center;
		width: 100%;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 1rem;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: .5rem;
		background: rgba(255,255,255,.08);
		color: rgba(255,255,255,.45);
		border: 1.5px solid rgba(255,255,255,.12);
		transition: all .2s ease;
	}

	.cta-btn:disabled { cursor: default; }

	.cta-btn--ready {
		background: linear-gradient(135deg, #0EAAA2, #A3337C);
		color: #fff;
		border-color: transparent;
		box-shadow: 0 8px 28px rgba(14,170,162,.4);
	}

	.cta-btn--ready:hover {
		box-shadow: 0 12px 36px rgba(14,170,162,.55);
		transform: translateY(-1px);
	}

	.cta-btn--adventure {
		font-size: 1.1rem;
		padding: 1.1rem 1.5rem;
		box-shadow: 0 12px 36px rgba(14,170,162,.45);
	}

	.cta-arrow { font-size: 1.1rem; }

	/* ── Team card ── */
	.card {
		background: #fff;
		border-radius: 1.5rem;
		overflow: hidden;
		box-shadow: 0 16px 48px rgba(0,0,0,.35);
	}

	.card-img-wrap {
		position: relative;
		max-height: 160px;
		overflow: hidden;
		background: #1a2352;
	}

	.card-img { display: block; width: 100%; height: auto; object-fit: cover; }

	.card-mode-badge {
		position: absolute;
		bottom: .6rem;
		left: .75rem;
		background: rgba(0,0,0,.55);
		backdrop-filter: blur(6px);
		color: #fff;
		font-size: .75rem;
		font-weight: 600;
		padding: .25rem .65rem;
		border-radius: 999px;
	}

	.card-body { padding: 1.25rem 1.25rem 1.5rem; }

	.card-title {
		font-size: 1.4rem;
		font-weight: 800;
		color: #1d1938;
		margin: 0 0 1.25rem;
	}

	/* ── Fields ── */
	.field { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }

	.field-label {
		font-size: .85rem;
		font-weight: 600;
		color: #1d1938;
	}

	.field-input {
		background: #f5f6fa;
		border: 1.5px solid #e0e0e0;
		border-radius: .75rem;
		padding: .8rem 1rem;
		font-size: .95rem;
		color: #1d1938;
		outline: none;
		transition: border-color .2s;
	}

	.field-input:focus { border-color: #0EAAA2; }

	/* ── Counter ── */
	.counter {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-top: .25rem;
	}

	.counter-val {
		font-size: 2rem;
		font-weight: 800;
		color: #1d1938;
		min-width: 2.5rem;
		text-align: center;
	}

	.counter-btn {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform .1s, background .15s;
	}

	.counter-btn--minus {
		background: #f0f0f0;
		color: #1d1938;
	}

	.counter-btn--minus:hover { background: #e0e0e0; }

	.counter-btn--plus {
		background: linear-gradient(135deg, #0EAAA2, #A3337C);
		color: #fff;
		box-shadow: 0 4px 12px rgba(14,170,162,.4);
	}

	.counter-btn--plus:hover { transform: scale(1.08); }

	/* ── Back link ── */
	.back-link {
		align-self: center;
		background: none;
		border: none;
		color: rgba(255,255,255,.45);
		font-size: .85rem;
		cursor: pointer;
		padding: .25rem .5rem;
		transition: color .2s;
	}

	.back-link:hover { color: rgba(255,255,255,.75); }
</style>
